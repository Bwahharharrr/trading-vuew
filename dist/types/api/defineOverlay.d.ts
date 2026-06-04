/**
 * @param {object} def
 * @param {string[]} def.useFor  - chart-data `type`s this overlay renders (required, non-empty)
 * @param {(ctx:CanvasRenderingContext2D, $:object)=>void} def.draw - required
 * @param {string} [def.name]
 * @param {object} [def.meta]    - { author, version, ... }
 * @param {object} [def.settings]- default settings merged under the overlay
 * @param {(()=>string[])} [def.dataColors]
 * @param {(()=>[number,number])} [def.yRange]
 * @param {Function} [def.calc]  - engine script object factory (computed overlays)
 * @param {object} [def.tool]    - drawing-tool descriptor (see defineTool)
 * @param {Function} [def.init] @param {Function} [def.destroy]
 * @param {object} [def.computed]@param {object} [def.methods]
 * @param {Array} [def.mixins]   - extra mixins (e.g. Tool)
 * @returns a Vue overlay component
 */
export function defineOverlay(def: {
    useFor: string[];
    draw: (ctx: CanvasRenderingContext2D, $: object) => void;
    name?: string | undefined;
    meta?: object | undefined;
    settings?: object | undefined;
    dataColors?: (() => string[]) | undefined;
    yRange?: (() => [number, number]) | undefined;
    calc?: Function | undefined;
    tool?: object | undefined;
    init?: Function | undefined;
    destroy?: Function | undefined;
    computed?: object | undefined;
    methods?: object | undefined;
    mixins?: any[] | undefined;
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
export default defineOverlay;
