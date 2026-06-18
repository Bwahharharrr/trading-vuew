declare namespace _default {
    namespace methods {
        function cursor_changed(e: any): void;
        function cursor_locked(state: any): void;
        function register_kb(event: any): void;
        function remove_kb(event: any): void;
    }
    function data(): {
        cursor: {
            x: null;
            xr: null;
            y: null;
            t: null;
            y$: null;
            grid_id: null;
            locked: boolean;
            values: {};
            scroll_lock: boolean;
            mode: string;
        };
    };
}
export default _default;
