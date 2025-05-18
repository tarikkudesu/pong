import { Vector } from './Vector';

interface WallProps {
	start: Vector;
	end: Vector;
}

export class Wall {
	public dir: Vector;
	public end: Vector;
	public start: Vector;
	public center: Vector;
	public length: number;
	constructor({ start, end }: WallProps) {
		this.start = start;
		this.end = end;
		this.dir = this.end.subtr(this.start).unit();
		this.center = this.start.add(this.end).mult(0.5);
		this.length = this.end.subtr(this.start).mag(); // ! Length Might not be needed
	}
}
