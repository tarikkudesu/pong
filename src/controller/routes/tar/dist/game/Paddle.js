import { Vector } from './Vector.js';
export const friction = 0.05;
export class Paddle {
    constructor({ constrains, radius, start, end }) {
        this.vel = new Vector(0, 0);
        this.acc = new Vector(0, 0);
        this.constrains = new Vector(0, 0);
        this.acceleration = 1.8;
        this.constrains = constrains;
        this.radius = radius;
        this.start = start;
        this.end = end;
        this.pos = this.start.add(this.end).mult(0.5);
        this.dir = this.end.subtr(this.start).unit();
        this.length = this.end.subtr(this.start).mag();
    }
    move(Up, Down) {
        if (Up)
            this.acc = this.dir.mult(-this.acceleration);
        if (Down)
            this.acc = this.dir.mult(this.acceleration);
        if (!Up && !Down)
            this.acc = new Vector(0, 0);
    }
    reposition() {
        this.acc = this.acc.unit().mult(this.acceleration);
        this.vel = this.vel.add(this.acc).mult(1 - friction);
        const newPos = this.pos.add(this.vel);
        if (newPos.y < this.constrains.x)
            newPos.y = this.constrains.x;
        if (newPos.y > this.constrains.y)
            newPos.y = this.constrains.y;
        this.pos = newPos;
        this.start = this.pos.add(this.dir.mult(-this.length / 2));
        this.end = this.pos.add(this.dir.mult(this.length / 2));
    }
}
