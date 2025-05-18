import { Vector } from './Vector.js';

interface BallProps {
	pos: Vector;
	radius: number;
	velocity: Vector;
}

export class Ball {
	public pos: Vector;
	public radius: number;
	public velocity: Vector = new Vector(0, 0);
	constructor({ pos, radius, velocity }: BallProps) {
		this.pos = pos;
		this.radius = radius;
		this.velocity = velocity;
	}
	reposition(): void {
		this.pos = this.pos.add(this.velocity.mult(10));
	}
}
