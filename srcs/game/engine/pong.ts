import * as Main from '../index.js';

// ! Vector ------------------------------------------------------------------------------------------------
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

// ! Ball ------------------------------------------------------------------------------------------------
interface BallProps {
	direction: Vector;
}
export class Ball {
	public pos: Vector;
	public direction: Vector = new Vector(0, 0);
	constructor({ direction }: BallProps) {
		this.pos = new Vector(Main.PongWidth / 2, Main.PongHeight / 2);
		this.direction = direction;
	}
	reposition(): void {
		this.pos = this.pos.add(this.direction.mult(Main.BallVelocity));
	}
}

// ! Wall ------------------------------------------------------------------------------------------------
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
		this.length = this.end.subtr(this.start).mag();
	}
}

// ! Paddle ------------------------------------------------------------------------------------------------
interface PaddleProps {
	center: Vector;
}
export class Paddle {
	public start: Vector;
	public end: Vector;
	public dir: Vector;
	public pos: Vector;
	public vel: Vector = new Vector(0, 0);
	public acc: Vector = new Vector(0, 0);
	public acceleration: number = 1.8;
	constructor({ center }: PaddleProps) {
		this.start = new Vector(center.x, center.y - Math.ceil(Main.PaddleHeight));
		this.end = new Vector(center.x, center.y + Math.ceil(Main.PaddleHeight));
		this.pos = center;
		this.dir = this.end.subtr(this.start).unit();
	}
	move(Up: boolean, Down: boolean): void {
		if (Up) this.acc = this.dir.mult(-this.acceleration);
		if (Down) this.acc = this.dir.mult(this.acceleration);
		if (!Up && !Down) this.acc = new Vector(0, 0);
	}
	reposition(): void {
		this.acc = this.acc.unit().mult(this.acceleration);
		this.vel = this.vel.add(this.acc).mult(1 - Main.friction);
		const newPos = this.pos.add(this.vel);
		if (newPos.y < 0) newPos.y = 0;
		if (newPos.y > Main.PongHeight) newPos.y = Main.PongHeight;
		this.pos = newPos;
		const length = this.end.subtr(this.start).mag();
		this.start = this.pos.add(this.dir.mult(-length / 2));
		this.end = this.pos.add(this.dir.mult(length / 2));
	}
}

// ! Game ------------------------------------------------------------------------------------------------
export enum BallState {
	IN = 1,
	OUT_LEFT = 3,
	OUT_RIGHT = 2,
}

class Keys {
	public UP_R: boolean = false;
	public DOWN_R: boolean = false;
	public UP_L: boolean = false;
	public DOWN_L: boolean = false;
}

export class Pong {
	// * player data
	public player: string;
	public opponent: string;
	public winner: string = '';
	public playerScore: number = 0;
	public opponentScore: number = 0;
	public playerNoBan: number = 1;

	// * game data
	public wait: boolean = false;
	public sound: boolean = false;
	public keys: Keys = new Keys();
	public TopWall: Wall = new Wall({ start: new Vector(0, 0), end: new Vector(0, 0) });
	public RightWall: Wall = new Wall({ start: new Vector(0, 0), end: new Vector(0, 0) });
	public BottomWall: Wall = new Wall({ start: new Vector(0, 0), end: new Vector(0, 0) });
	public LeftWall: Wall = new Wall({ start: new Vector(0, 0), end: new Vector(0, 0) });
	public ball: Ball = new Ball({ direction: new Vector(0, 0) });
	public rightPaddle: Paddle = new Paddle({ center: new Vector(0, 0) });
	public leftPaddle: Paddle = new Paddle({ center: new Vector(0, 0) });

	constructor(player: string, opponent: string) {
		this.player = player;
		this.opponent = opponent;

		// * Create Walls
		this.TopWall = new Wall({ start: new Vector(0, 0), end: new Vector(Main.PongWidth, 0) });
		this.RightWall = new Wall({ start: new Vector(Main.PongWidth, 0), end: new Vector(Main.PongWidth, Main.PongHeight) });
		this.BottomWall = new Wall({ start: new Vector(Main.PongWidth, Main.PongHeight), end: new Vector(0, Main.PongHeight) });
		this.LeftWall = new Wall({ start: new Vector(0, Main.PongHeight), end: new Vector(0, 0) });

		// * Create Paddles
		this.rightPaddle = new Paddle({ center: new Vector(Main.PongWidth - Main.PaddleDistance, Math.ceil(Main.PongHeight / 2)) });
		this.leftPaddle = new Paddle({ center: new Vector(Main.PaddleDistance, Math.ceil(Main.PongHeight / 2)) });
		this.setup();
	}
	setup(): void {
		let angle: number = Main.randInt((-Math.PI / 4) * 1000, (Math.PI / 4) * 1000) / 1000;
		if (this.playerNoBan === 3 || this.playerNoBan === 4) angle += Math.PI;
		this.ball = new Ball({ direction: new Vector(1 * Math.cos(angle), 1 * Math.sin(angle)).unit() });
		setTimeout(() => (this.wait = true), 1000);
	}
	keyPressRight(up: boolean, down: boolean): void {
		if (up) this.keys.UP_R = true;
		else this.keys.UP_R = false;
		if (down) this.keys.DOWN_R = true;
		else this.keys.DOWN_R = false;
		this.rightPaddle.move(up, down);
	}
	keyPressLeft(up: boolean, down: boolean): void {
		if (up) this.keys.UP_R = true;
		else this.keys.UP_R = false;
		if (down) this.keys.DOWN_R = true;
		else this.keys.DOWN_R = false;
		this.leftPaddle.move(up, down);
	}

	// ! Walls
	// * COLLISION DETECTION
	collision_detection_ball_wall_top(): boolean {
		return this.ball.pos.y < Main.BallRadius;
	}
	collision_detection_ball_wall_bottom(): boolean {
		return this.ball.pos.y > Main.PongHeight - Main.BallRadius;
	}
	collision_detection_ball_wall_left(): void {
		// return this.ball.pos.x < Main.BallRadius;
		if (this.ball.pos.x < Main.BallRadius) {
			this.opponentScore += 1;
			this.playerNoBan += 1;
			this.wait = false;
			this.setup();
		}
	}
	collision_detection_ball_wall_right(): void {
		// return this.ball.pos.x > Main.PongWidth - Main.BallRadius;
		if (this.ball.pos.x > Main.PongWidth - Main.BallRadius) {
			this.playerScore += 1;
			this.playerNoBan += 1;
			this.wait = false;
			this.setup();
		}
	}
	// * PENETRATION RESOLUTION
	penetration_resolution_ball_wall_top(): void {
		const currPos: Vector = this.ball.pos;
		this.ball.pos.y = Main.BallRadius;
		this.ball.pos.x = (this.ball.direction.x * (this.ball.pos.y - currPos.y)) / this.ball.direction.y + currPos.x;
	}
	penetration_resolution_ball_wall_bottom(): void {
		const currPos: Vector = this.ball.pos;
		this.ball.pos.y = Main.PongHeight - Main.BallRadius;
		this.ball.pos.x = (this.ball.direction.x * (this.ball.pos.y - currPos.y)) / this.ball.direction.y + currPos.x;
	}
	penetration_resolution_ball_wall_left(): void {
		const currPos: Vector = this.ball.pos;
		this.ball.pos.x = Main.BallRadius;
		this.ball.pos.y = (this.ball.direction.y * (this.ball.pos.x - currPos.x)) / this.ball.direction.x + currPos.y;
	}
	penetration_resolution_ball_wall_right(): void {
		const currPos: Vector = this.ball.pos;
		this.ball.pos.x = Main.PongWidth - Main.BallRadius;
		this.ball.pos.y = (this.ball.direction.y * (this.ball.pos.x - currPos.x)) / this.ball.direction.x + currPos.y;
	}
	// * COLLISION RESPONSE
	collision_response_ball_wall(closest: Vector): void {
		const normal = this.ball.pos.subtr(closest).unit();
		this.ball.direction = this.ball.direction.subtr(normal.mult(2 * Vector.dot(this.ball.direction, normal)));
		this.sound = true;
	}
	// ! Paddles
	// * COLLISION DETECTION
	collision_detection_ball_paddle(closest: Vector): boolean {
		const dist: number = closest.subtr(this.ball.pos).mag();
		if (dist < Main.PaddleRadius + Main.BallRadius) return true;
		return false;
	}
	// * PENETRATION RESOLUTION
	penetration_resolution_ball_paddle(closest: Vector): void {
		const penetration: Vector = this.ball.pos.subtr(closest);
		this.ball.pos = this.ball.pos.add(penetration.unit().mult(Main.BallRadius + Main.PaddleRadius - penetration.mag()));
	}
	// * COLLISION RESPONSE
	collision_response_ball_paddle_right(closest: Vector): void {
		const normal = this.ball.pos.subtr(closest).unit();
		this.ball.direction = this.ball.direction
			.subtr(normal.mult(Vector.dot(this.ball.direction, normal)).mult(2))
			.mult(1 + this.rightPaddle.acc.unit().mag() * 0.2);
		if (this.ball.direction.mag() > 2) this.ball.direction = this.ball.direction.unit().mult(2);
		if (Math.abs(this.ball.direction.y) > Math.abs(this.ball.direction.x)) {
			const x = this.ball.direction.x;
			this.ball.direction.x = this.ball.direction.y;
			this.ball.direction.y = x;
		}
		this.sound = true;
	}
	collision_response_ball_paddle_left(closest: Vector): void {
		const normal = this.ball.pos.subtr(closest).unit();
		this.ball.direction = this.ball.direction
			.subtr(normal.mult(Vector.dot(this.ball.direction, normal)).mult(2))
			.mult(1 + this.leftPaddle.acc.unit().mag() * 0.2);
		if (this.ball.direction.mag() > 2) this.ball.direction = this.ball.direction.unit().mult(2);
		if (Math.abs(this.ball.direction.y) > Math.abs(this.ball.direction.x)) {
			const x = this.ball.direction.x;
			this.ball.direction.x = this.ball.direction.y;
			this.ball.direction.y = x;
		}
		this.sound = true;
	}

	// * Collisions
	closestPointOnLineSigment(point: Vector, start: Vector, end: Vector): Vector {
		const dir: Vector = end.subtr(start).unit();
		// * check if the ball is before the line segment
		const ballToWallStart = start.subtr(point);
		if (Vector.dot(dir, ballToWallStart) > 0) return start;
		// * check if the ball is after the line segment
		const wallEndToBall = point.subtr(end);
		if (Vector.dot(dir, wallEndToBall) > 0) return end;
		// * check if the ball is inside the line segment
		const closestDist = Vector.dot(dir, ballToWallStart);
		const closestVect = dir.mult(closestDist);
		return start.subtr(closestVect);
	}

	// * Main Frame
	updateObjects() {
		let closest: Vector = this.closestPointOnLineSigment(this.ball.pos, this.TopWall.start, this.TopWall.end);
		if (this.collision_detection_ball_wall_top()) {
			this.penetration_resolution_ball_wall_top();
			this.collision_response_ball_wall(closest);
		}
		closest = this.closestPointOnLineSigment(this.ball.pos, this.BottomWall.start, this.BottomWall.end);
		if (this.collision_detection_ball_wall_bottom()) {
			this.penetration_resolution_ball_wall_bottom();
			this.collision_response_ball_wall(closest);
		}
		// closest = this.closestPointOnLineSigment(this.ball.pos, this.RightWall.start, this.RightWall.end);
		// if (this.collision_detection_ball_wall_right()) {
		// 	this.penetration_resolution_ball_wall_right();
		// 	this.collision_response_ball_wall(closest);
		// }
		// closest = this.closestPointOnLineSigment(this.ball.pos, this.LeftWall.start, this.LeftWall.end);
		// if (this.collision_detection_ball_wall_left()) {
		// 	this.penetration_resolution_ball_wall_left();
		// 	this.collision_response_ball_wall(closest);
		// }
		this.collision_detection_ball_wall_right();
		this.collision_detection_ball_wall_left();
		if (this.wait) this.ball.reposition();
		closest = this.closestPointOnLineSigment(this.ball.pos, this.rightPaddle.start, this.rightPaddle.end);
		if (this.collision_detection_ball_paddle(closest)) {
			this.penetration_resolution_ball_paddle(closest);
			this.collision_response_ball_paddle_right(closest);
		}
		closest = this.closestPointOnLineSigment(this.ball.pos, this.leftPaddle.start, this.leftPaddle.end);
		if (this.collision_detection_ball_paddle(closest)) {
			this.penetration_resolution_ball_paddle(closest);
			this.collision_response_ball_paddle_left(closest);
		}
		this.rightPaddle.reposition();
		this.leftPaddle.reposition();
	}
	update(): boolean {
		if (this.winner !== '') return true;
		this.sound = false;
		this.updateObjects();
		if (this.playerScore >= 7) this.winner = this.opponent;
		else if (this.opponentScore >= 7) this.winner = this.player;
		if (this.playerNoBan >= 5) this.playerNoBan = 1;
		return false;
	}
}

// ! END
