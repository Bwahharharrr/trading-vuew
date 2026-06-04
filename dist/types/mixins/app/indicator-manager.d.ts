declare namespace _default {
    function data(): {
        indicatorVisibility: {};
        lastIndicatorSet: never[];
        indicatorSettingsOpen: boolean;
        indicatorSettingsData: null;
        persistentIndicatorsRaw: {};
        persistentIndicatorsClipped: never[];
        persistentIndicatorVisibility: {};
        accordionExpandedViews: {};
    };
    namespace computed {
        function offchartIndicators(): any;
        function viewIndicatorsAccordion(): {
            title: string;
            isExpanded: boolean;
            isCurrentView: boolean;
            indicators: any;
        }[];
    }
    namespace methods {
        function loadPersistentIndicators(): Promise<void>;
        function clipPersistentIndicators(timeframe?: null, chartData?: null): any;
        function isPersistentIndicatorVisible(name: any): any;
        function togglePersistentIndicatorVisibility(name: any): void;
        function toggleAccordion(viewTitle: any): void;
        function toggleViewIndicatorVisibility(viewTitle: any, indicatorName: any): void;
        function toggleIndicatorVisibility(index: any): void;
        function openIndicatorSettings(indicatorInfo: any): void;
        function onCloseIndicator(payload: any): void;
        function closeIndicatorSettings(): void;
        function applyIndicatorSettings(payload: any): void;
        function getIndicatorSettings(): {};
        function applyRestoredIndicatorSettings(savedSettings: any): void;
    }
    let watch: {
        'currentFileMeta.indicators_url'(newUrl: any, oldUrl: any): void;
    };
}
export default _default;
