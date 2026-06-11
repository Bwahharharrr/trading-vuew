// Semi-automatic pin object. For stretching things.

import Utils from '../../stuff/utils.js'

export default class Pin {

    // (Comp reference, a name in overlay settings,
    // pin parameters)
    constructor(comp, name, params = {}) {

        this.RADIUS = comp.$props.config.PIN_RADIUS || 5.5
        this.RADIUS_SQ = Math.pow(this.RADIUS + 7, 2)

        if (Utils.is_mobile) {
            this.RADIUS += 2
            this.RADIUS_SQ *= 2.5
        }

        this.COLOR_BACK = comp.$props.colors.back
        this.COLOR_BR = comp.$props.colors.text

        this.comp = comp
        this.layout = comp.layout
        this.mouse = comp.mouse
        this.name = name
        this.state = params.state || 'settled'
        this.hidden = params.hidden || false

        this.on_mousemove = e => this.mousemove(e)
        this.on_mousedown = e => this.mousedown(e)
        this.on_mouseup = e => this.mouseup(e)

        this.mouse.on('mousemove', this.on_mousemove)
        this.mouse.on('mousedown', this.on_mousedown)
        this.mouse.on('mouseup', this.on_mouseup)

        if (comp.state === 'finished') {
            this.state = 'settled'
            this.update_from(comp.$props.settings[name])
        } else {
            this.update()
        }

        if (this.state !== 'settled') {
            this.comp.custom_event('scroll-lock', true)
        }
    }

    re_init() {
        this.update_from(
            this.comp.$props.settings[this.name]
        )
    }

    destroy() {
        this.mouse.off('mousemove', this.on_mousemove)
        this.mouse.off('mousedown', this.on_mousedown)
        this.mouse.off('mouseup', this.on_mouseup)
    }

    draw(ctx) {
        if (this.hidden) return
        switch (this.state) {
            case 'tracking':
                break
            case 'dragging':
                if (!this.moved) this.draw_circle(ctx)
                break
            case 'settled':
                this.draw_circle(ctx)
                break
        }
    }

    draw_circle(ctx) {

        this.layout = this.comp.layout
        let r, lw
        if (this.comp.selected) {
            r = this.RADIUS; lw = 1.5
        } else {
            r = this.RADIUS * 0.95; lw = 1
        }

        ctx.lineWidth = lw
        ctx.strokeStyle = this.COLOR_BR
        ctx.fillStyle = this.COLOR_BACK
        ctx.beginPath()
        ctx.arc(
            this.x = this.layout.t2screen(this.t),
            this.y = this.layout.$2screen(this.y$),
            r + 0.5, 0, Math.PI * 2, true)
        ctx.fill()
        ctx.stroke()
    }

    update() {

        this.y$ = this.comp.$props.cursor.y$
        this.y =  this.comp.$props.cursor.y
        this.t = this.comp.$props.cursor.t
        this.x =  this.comp.$props.cursor.x

        // Save pin as time in IB mode
        //if (this.layout.ti_map.ib) {
        //    this.t = this.layout.ti_map.i2t(this.t )
        //}

        // Reset the settings attahed to the pin (position).
        // NB: route via the overlay mixin's custom_event (NOT raw $emit) — it
        // appends grid_id/layer_id/$uuid and re-emits as 'custom-event', the only
        // path Grid wires to the DataCube. Bare $emits have had no listener since
        // the Vue-3 migration removed overlay.js's `$emit = custom_event` patch,
        // which silently broke pin position persistence, scroll-lock and
        // object-selected for every pin-based tool (same fix as price.js).
        this.comp.custom_event('change-settings', {
             [this.name]: [this.t, this.y$]
        })
    }

    update_from(data, emit = false) {

        if (!data) return
        this.layout = this.comp.layout

        this.y$ = data[1]
        this.y = this.layout.$2screen(this.y$)
        this.t = data[0]
        this.x = this.layout.t2screen(this.t)

        // TODO: Save pin as time in IB mode
        //if (this.layout.ti_map.ib) {
        //    this.t = this.layout.ti_map.i2t(this.t )
        //}

        if (emit) this.comp.custom_event('change-settings', {
             [this.name]: [this.t, this.y$]
        })

    }

    rec_position() {
        this.t1 = this.t
        this.y$1 = this.y$
    }

    mousemove(event) {

        switch(this.state) {
            case 'tracking':
            case 'dragging':
                this.moved = true
                this.update()
                break
        }


    }

    mousedown(event, force = false) {
        if (Utils.default_prevented(event) && !force) return
        switch (this.state) {
            case 'tracking':
                this.state = 'settled'
                if (this.on_settled) this.on_settled()
                this.comp.custom_event('scroll-lock', false)
                break
            case 'settled':
                if (this.hidden) return
                if (this.hover()) {
                    this.state = 'dragging'
                    this.moved = false
                    this.comp.custom_event('scroll-lock', true)
                    this.comp.custom_event('object-selected')
                }
                break
        }
        if (this.hover()) {
            event.preventDefault()
        }
    }

    mouseup(event) {
        switch (this.state) {
            case 'dragging':
                this.state = 'settled'
                if (this.on_settled) this.on_settled()
                this.comp.custom_event('scroll-lock', false)
                break
        }
    }

    on(name, handler) {
        switch (name) {
            case 'settled':
                this.on_settled = handler
                break
        }
    }

    hover() {
        let x = this.x
        let y = this.y
        return (
            (x - this.mouse.x) * (x - this.mouse.x) +
            (y - this.mouse.y) * (y - this.mouse.y)
        ) < this.RADIUS_SQ
    }

}
