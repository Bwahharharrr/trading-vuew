// CorkySearchFeed — orchestration over a CorkyClient for the historical
// indicator search interface (search_candles / cancel_search).
//
// A search is NOT a live subscription: it is a one-shot historical query that
// STREAMS its results and then terminates. Each search is keyed by its
// `search_id` (the caller mints it into the query); the gateway echoes that id
// on every event with `request_id: null`, so events are routed by `search_id`,
// never by request correlation (see CorkyClient._route — search_* events fan out
// only on their type channel).
//
// Lifecycle per search:
//   search_accepted → search_progress* → search_match* → ONE terminal
//   (search_complete | search_cancelled | search_failed | error[search_id]).
//
// Partial results are sacred: on a mid-flight socket drop or failure we mark the
// search failed but KEEP every match already accumulated (the spec requires
// preserving partial results on cancel/failure). Matches are de-duped by their
// strictly-increasing `sequence`.
//
// Deliberately decoupled from chart data and the DataCube — results are a
// transient query surface owned by the UI, not candles.

import { projectMatchRow } from './search-query.js'

const TERMINAL = new Set(['complete', 'cancelled', 'failed'])

export class CorkySearchFeed {
    constructor({ client } = {}) {
        if (!client) throw new Error('CorkySearchFeed: `client` is required')
        this.client = client

        // Deterministic search_id minting (counter + prefix; no randomness /
        // wall-clock), mirroring CorkyClient / CorkyPositionsFeed discipline.
        this._counter = 0

        // search_id → record (routing + accumulation state for that search).
        this._searches = new Map()

        // Type-channel listeners — search events carry request_id:null, so we
        // observe them globally and dispatch by search_id. `close` lets us fail
        // in-flight searches (preserving partials) when the socket drops.
        this._off = []
        if (typeof this.client.on === 'function') {
            const bind = (type, fn) => this._off.push(this.client.on(type, fn))
            bind('search_accepted', (p) => this._onAccepted(p))
            bind('search_progress', (p) => this._onProgress(p))
            bind('search_match', (p) => this._onMatch(p))
            bind('search_complete', (p) => this._onComplete(p))
            bind('search_cancelled', (p) => this._onCancelled(p))
            bind('search_failed', (p) => this._onFailed(p))
            // A generic error MAY carry a search_id (mid-scan failure); ignore
            // request-correlated errors that don't name a known search.
            bind('error', (p) => this._onError(p))
            bind('close', () => this._onClose())
        }
    }

    /** Mint a deterministic, unique search_id (caller stamps it into the query). */
    nextSearchId(prefix = 'corky-search') {
        this._counter += 1
        return `${prefix}-${this._counter}`
    }

    /**
     * Start a search. `query` must already carry a `search_id` (build it with
     * buildSearchQuery, minting the id via {@link nextSearchId}). `handlers`:
     *   onAccepted(meta)      — query accepted, scan begins
     *   onProgress(progress)  — { phase, current, total, message }
     *   onMatch(row, info)    — row = projectMatchRow(result); info={ sequence, result }
     *   onComplete(summary)   — { matches, scanned_rows } (terminal)
     *   onCancelled(info)     — terminal, after cancel()
     *   onFailed(err)         — terminal; err={ code, message }; partials kept
     * Returns a handle; pass it (or the search_id) to {@link cancel}.
     */
    startSearch(query, handlers = {}) {
        if (!query || !query.search_id) {
            throw new Error('CorkySearchFeed.startSearch: query.search_id is required')
        }
        const search_id = query.search_id
        const record = {
            search_id,
            query,
            handlers,
            status: 'pending',     // pending → running → complete|cancelled|failed
            progress: null,
            matches: [],           // projected display rows, in arrival order
            lastSeq: -Infinity,    // strictly-increasing sequence guard
            error: null,
            summary: null,
            closed: false,
        }
        this._searches.set(search_id, record)
        // Fire the frame. The client queues while CONNECTING and only throws when
        // truly unsendable — surface that synchronous throw as a failure (with no
        // partials yet) rather than leaving a record stuck at 'pending'.
        try {
            this.client.searchCandles(query)
        } catch (err) {
            this._fail(record, { code: err && err.code, message: (err && err.message) || String(err) })
        }
        return { search_id, cancel: () => this.cancel(search_id) }
    }

    /**
     * Cancel an in-flight search (by handle or search_id). Best-effort: sends
     * cancel_search and marks the record cancelling; the terminal
     * search_cancelled finalises it. Accumulated matches are retained.
     */
    cancel(handleOrId) {
        const search_id = typeof handleOrId === 'string' ? handleOrId : (handleOrId && handleOrId.search_id)
        if (!search_id) return
        const record = this._searches.get(search_id)
        if (!record || TERMINAL.has(record.status)) return
        record.status = 'cancelling'
        try {
            this.client.cancelSearch(search_id)
        } catch (_) { /* socket gone — _onClose will finalise as failed */ }
    }

    /** Forget a finished (or abandoned) search; cancels first if still running. */
    forget(handleOrId) {
        const search_id = typeof handleOrId === 'string' ? handleOrId : (handleOrId && handleOrId.search_id)
        if (!search_id) return
        const record = this._searches.get(search_id)
        if (record && !TERMINAL.has(record.status)) this.cancel(search_id)
        if (record) record.closed = true
        this._searches.delete(search_id)
    }

    // ── inbound routing (dispatch by search_id) ──────────────────────────────

    _recordFor(payload) {
        const ev = payload && payload.event
        if (!ev) return null
        return this._searches.get(ev.search_id) || null
    }

    _onAccepted(payload) {
        const rec = this._recordFor(payload)
        if (!rec || rec.closed) return
        if (TERMINAL.has(rec.status)) return
        rec.status = 'running'
        this._safe(rec.handlers.onAccepted, payload.event)
    }

    _onProgress(payload) {
        const rec = this._recordFor(payload)
        if (!rec || rec.closed) return
        if (TERMINAL.has(rec.status)) return
        if (rec.status === 'pending') rec.status = 'running'
        const ev = payload.event
        rec.progress = {
            phase: ev.phase, current: ev.current, total: ev.total, message: ev.message,
        }
        this._safe(rec.handlers.onProgress, rec.progress)
    }

    _onMatch(payload) {
        const rec = this._recordFor(payload)
        if (!rec || rec.closed) return
        if (TERMINAL.has(rec.status)) return
        const ev = payload.event
        // Strictly-increasing sequence: drop stale / duplicate matches.
        const seq = ev.sequence
        if (typeof seq === 'number') {
            if (seq <= rec.lastSeq) return
            rec.lastSeq = seq
        }
        if (rec.status === 'pending') rec.status = 'running'
        const row = projectMatchRow(ev.result)
        if (!row) return
        rec.matches.push(row)
        this._safe(rec.handlers.onMatch, row, { sequence: seq, result: ev.result })
    }

    _onComplete(payload) {
        const rec = this._recordFor(payload)
        if (!rec || rec.closed || TERMINAL.has(rec.status)) return
        const ev = payload.event
        rec.status = 'complete'
        rec.summary = { matches: ev.matches, scanned_rows: ev.scanned_rows }
        this._safe(rec.handlers.onComplete, rec.summary)
    }

    _onCancelled(payload) {
        const rec = this._recordFor(payload)
        if (!rec || rec.closed || TERMINAL.has(rec.status)) return
        rec.status = 'cancelled'
        this._safe(rec.handlers.onCancelled, payload.event)
    }

    _onFailed(payload) {
        const rec = this._recordFor(payload)
        if (!rec || rec.closed || TERMINAL.has(rec.status)) return
        this._fail(rec, this._failInfo(payload.event, 'search_failed'))
    }

    _onError(payload) {
        // Only a search-scoped error (carries a known search_id) finalises a
        // search; a request-correlated parse/control error is handled elsewhere.
        const rec = this._recordFor(payload)
        if (!rec || rec.closed || TERMINAL.has(rec.status)) return
        this._fail(rec, this._failInfo(payload.event, 'search_error'))
    }

    // Normalize a terminal failure event into { code, message }. The gateway is
    // inconsistent: an `error` event uses code+message, but `search_failed` puts
    // the human detail in `event.error` (and may omit code/message). Surface
    // whatever is present so the UI never shows a blank "Search failed".
    _failInfo(ev, fallbackCode) {
        ev = ev || {}
        return {
            code: ev.code || fallbackCode,
            message: ev.message || ev.error || ev.code || 'search failed',
        }
    }

    // Socket dropped: no resume for searches — fail every in-flight one but KEEP
    // its accumulated matches (partials are preserved per the contract).
    _onClose() {
        for (const rec of this._searches.values()) {
            if (rec.closed || TERMINAL.has(rec.status)) continue
            this._fail(rec, { code: 'connection_lost', message: 'connection lost during search' })
        }
    }

    _fail(rec, err) {
        rec.status = 'failed'
        rec.error = err
        this._safe(rec.handlers.onFailed, err)
    }

    _safe(fn, ...args) {
        if (typeof fn !== 'function') return
        try { fn(...args) } catch (_) { /* consumer threw; isolate */ }
    }

    /** Tear down: detach listeners and forget all searches (cancelling live ones). */
    destroy() {
        for (const search_id of Array.from(this._searches.keys())) this.forget(search_id)
        for (const off of this._off) { try { off() } catch (_) { /* ignore */ } }
        this._off = []
    }
}

export default CorkySearchFeed
