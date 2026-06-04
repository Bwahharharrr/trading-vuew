export default class SyncTransport {
    se: ScriptEngine;
    onevent: () => void;
    _dispatch: (msg: any) => Promise<void>;
    _receive(msg: any): void;
    send(msg: any): Promise<void>;
    destroy(): void;
}
import { ScriptEngine } from '../script_engine.js';
