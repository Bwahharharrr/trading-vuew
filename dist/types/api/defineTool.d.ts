/**
 * @param {object} def - everything defineOverlay accepts, plus:
 * @param {string} def.type   - tool type id (required)
 * @param {string} [def.group]- toolbar group
 * @param {string} [def.icon] - toolbar icon
 * @param {string} [def.hint] - tooltip
 * @param {Array}  [def.data] @param {object} [def.settings] @param {object} [def.mods]
 * @param {Function} [def.init_tool] - anchor/pin setup
 */
export function defineTool(def: {
    type: string;
    group?: string | undefined;
    icon?: string | undefined;
    hint?: string | undefined;
    data?: any[] | undefined;
    settings?: object | undefined;
    mods?: object | undefined;
    init_tool?: Function | undefined;
}): {
    name: string;
    mixins: any[];
    methods: {
        use_for(): string[];
        meta_info(): object;
        $ctx: () => {
            layout: any;
            data: any;
            sub: any;
            settings: any;
            colors: any;
            cursor: any;
            num: any;
            interval: any;
            tf: any;
            font: any;
            id: any;
            grid_id: any;
        };
        draw(ctx: any): void;
    };
    computed: {};
};
export default defineTool;
