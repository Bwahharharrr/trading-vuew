/**
 * Wire engine -> DC events. The engine calls `se.send(type, data)`; we forward
 * the whitelisted event types to `post` as a `{type, data}` envelope.
 * @param {object} se   - a ScriptEngine instance
 * @param {(msg:any)=>void} post - delivers a message to the DC side
 */
export function wireEngineEvents(se: object, post: (msg: any) => void): void;
/**
 * Build the DC -> engine message dispatcher.
 * @param {object} se   - a ScriptEngine instance
 * @param {(msg:any)=>void} post - delivers a message to the DC side
 * @returns {(msg:any)=>Promise<void>} dispatch(msg)
 */
export function makeDispatcher(se: object, post: (msg: any) => void): (msg: any) => Promise<void>;
