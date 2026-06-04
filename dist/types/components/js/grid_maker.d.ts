export default GridMaker;
declare function GridMaker(id: any, params: any, master_grid?: null): {
    create: () => any;
    get_layout: () => {
        ti_map: any;
    };
    set_sidebar: (v: any) => any;
    get_sidebar: () => any;
};
