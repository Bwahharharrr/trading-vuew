
// Draws a segment, adds corresponding collision f-n

import Math2 from '../../stuff/math.js'
import PrimitiveBase from './primitive-base.js'

export default class Seg extends PrimitiveBase {

    // p1[t, $], p2[t, $] (time-price coordinates)
    draw(p1, p2) {

        let [x1, y1] = this.toScreen(p1)
        let [x2, y2] = this.toScreen(p2)

        this.ctx.moveTo(x1, y1)
        this.ctx.lineTo(x2, y2)

        this.comp.collisions.push(
            this.make([x1, y1], [x2, y2])
        )
    }

    // Collision function. x, y - mouse coord.
    make(p1, p2) {
        return (x, y) => {
            return Math2.point2seg(
                [x, y], p1, p2
            ) < this.T
        }
    }
}
