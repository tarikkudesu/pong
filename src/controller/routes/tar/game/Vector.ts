export class Vector {
	public x: number;
	public y: number;
	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}
	add(v: Vector): Vector {
		return new Vector(this.x + v.x, this.y + v.y);
	}
	subtr(v: Vector): Vector {
		return new Vector(this.x - v.x, this.y - v.y);
	}
	mag(): number {
		return Math.sqrt(this.x ** 2 + this.y ** 2);
	}
	mult(n: number): Vector {
		return new Vector(this.x * n, this.y * n);
	}
	normal(): Vector {
		return new Vector(-this.y, this.x).unit();
	}
	unit(): Vector {
		if (this.mag() === 0) return new Vector(0, 0);
		else return new Vector(this.x / this.mag(), this.y / this.mag());
	}
	static dot(v1: Vector, v2: Vector): number {
		return v1.x * v2.x + v1.y * v2.y;
	}
	static cross(v1: Vector, v2: Vector): number {
		return v1.x * v2.y - v1.y * v2.x;
	}
}
