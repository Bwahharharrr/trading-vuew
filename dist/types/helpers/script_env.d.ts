export default class ScriptEnv {
    constructor(s: any, data: any);
    std: any;
    id: any;
    src: any;
    output: any;
    data: any[];
    tss: {};
    syms: {};
    shared: any;
    onchart: {};
    offchart: {};
    build(): void;
    init(): void;
    step(unshift?: boolean): void;
    unshift(): void;
    limit(): void;
    copy(v: any, unshift?: boolean): void;
    make_box(src: any): Function;
    make_modules(): string;
    prep(src: any): any;
    postfix(src: any, m: any, call_id: any): any;
    parentheses(str: any): any;
    fdef(fname: any): any;
    get_args(src: any): string[];
    get_args_2(str: any): any[];
    regex_clone(rex: any): RegExp;
    send_modify(upd: any): void;
}
