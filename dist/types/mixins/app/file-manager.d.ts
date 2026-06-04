declare namespace _default {
    function data(): {
        dataFiles: never[];
        currentDataFile: string;
        selectedDataFile: string;
        currentFileMeta: null;
        pendingFileLoad: null;
        pendingIndicatorSettings: null;
    };
    namespace methods {
        function loadDataFileList(): Promise<void>;
        function onFileSelected(filename: any): Promise<void>;
        function saveStateToStorage(): void;
        function loadStateFromStorage(): {} | null;
    }
    namespace watch {
        function dataFiles(newFiles: any): void;
    }
}
export default _default;
