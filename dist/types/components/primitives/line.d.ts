export default class Line extends PrimitiveBase {
    draw(p1: any, p2: any): void;
    make(p1: any, p2: any): (x: any, y: any) => boolean;
}
import PrimitiveBase from './primitive-base.js';
