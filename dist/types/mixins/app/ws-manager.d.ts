declare namespace _default {
    function data(): {
        ws: null;
        wsConnected: boolean;
        wsReconnectTimer: null;
        wsReconnectDelay: number;
        wsUrl: null;
        _wsGen: number;
        liveScmrColors: never[];
        liveAlertColors: never[];
        liveZones: never[];
        liveAlerts: never[];
        liveDataStartIdx: number;
    };
    namespace methods {
        function wsConnect(url: any): void;
        function wsDisconnect(): void;
        function _wsScheduleReconnect(originatingGen: any): void;
        function _wsMsgMatchesCurrentFile(msg: any): boolean;
        function _wsBuildUrl(meta: any): string | null;
        function _wsOnMessage(msg: any): void;
        function _wsHandleCandle(msg: any): void;
        function _wsHandleAlert(msg: any): void;
        function _wsHandleSnapshot(msg: any): void;
        function _wsApplyLiveColors(): void;
    }
    namespace watch {
        function displayedView(): void;
        function currentDataFile(): void;
        function currentFileMeta(newMeta: any, oldMeta: any): void;
    }
    function beforeUnmount(): void;
}
export default _default;
