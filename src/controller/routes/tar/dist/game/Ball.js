import { Vector } from './Vector.js';
export class Ball {
    constructor({ pos, radius, velocity }) {
        this.velocity = new Vector(0, 0);
        this.pos = pos;
        this.radius = radius;
        this.velocity = velocity;
    }
    reposition() {
        this.pos = this.pos.add(this.velocity.mult(10));
    }
}
