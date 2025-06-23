import { friction, PongWidth, PongHeight, randInt } from './index.js';

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
	constrains: Vector;
	radius: number;
	start: Vector;
	end: Vector;
}
export class Paddle {
	public start: Vector;
	public end: Vector;
	public radius: number;
	public length: number;
	public dir: Vector;
	public pos: Vector;
	public vel: Vector = new Vector(0, 0);
	public acc: Vector = new Vector(0, 0);
	public constrains: Vector = new Vector(0, 0);
	public acceleration: number = 1.8;
	constructor({ constrains, radius, start, end }: PaddleProps) {
		this.constrains = constrains;
		this.radius = radius;
		this.start = start;
		this.end = end;
		this.pos = this.start.add(this.end).mult(0.5);
		this.dir = this.end.subtr(this.start).unit();
		this.length = this.end.subtr(this.start).mag();
	}
	move(Up: boolean, Down: boolean): void {
		if (Up) this.acc = this.dir.mult(-this.acceleration);
		if (Down) this.acc = this.dir.mult(this.acceleration);
		if (!Up && !Down) this.acc = new Vector(0, 0);
	}
	reposition(): void {
		this.acc = this.acc.unit().mult(this.acceleration);
		this.vel = this.vel.add(this.acc).mult(1 - friction);
		const newPos = this.pos.add(this.vel);
		if (newPos.y < this.constrains.x) newPos.y = this.constrains.x;
		if (newPos.y > this.constrains.y) newPos.y = this.constrains.y;
		this.pos = newPos;
		this.start = this.pos.add(this.dir.mult(-this.length / 2));
		this.end = this.pos.add(this.dir.mult(this.length / 2));
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
	public ballRadius: number = 10; // * Customizable
	public paddleHeight: number = 60; // * Customizable
	public paddleRadius: number = 10; // * Customizable
	public paddleDistance: number = 15; // * Customizable
	public TopWall: Wall = new Wall({ start: new Vector(0, 0), end: new Vector(0, 0) });
	public RightWall: Wall = new Wall({ start: new Vector(0, 0), end: new Vector(0, 0) });
	public BottomWall: Wall = new Wall({ start: new Vector(0, 0), end: new Vector(0, 0) });
	public LeftWall: Wall = new Wall({ start: new Vector(0, 0), end: new Vector(0, 0) });
	public ball: Ball = new Ball({ pos: new Vector(0, 0), radius: 0, velocity: new Vector(0, 0) });
	public rightPaddle: Paddle = new Paddle({ start: new Vector(0, 0), end: new Vector(0, 0), radius: 0, constrains: new Vector(0, 0) });
	public leftPaddle: Paddle = new Paddle({ start: new Vector(0, 0), end: new Vector(0, 0), radius: 0, constrains: new Vector(0, 0) });

	constructor(player: string, opponent: string) {
		this.player = player;
		this.opponent = opponent;

		// * Create Walls
		this.TopWall = new Wall({ start: new Vector(0, 0), end: new Vector(PongWidth, 0) });
		this.RightWall = new Wall({ start: new Vector(PongWidth, 0), end: new Vector(PongWidth, PongHeight) });
		this.BottomWall = new Wall({ start: new Vector(PongWidth, PongHeight), end: new Vector(0, PongHeight) });
		this.LeftWall = new Wall({ start: new Vector(0, PongHeight), end: new Vector(0, 0) });

		// * Create Paddles
		this.rightPaddle = new Paddle({
			start: new Vector(PongWidth - this.paddleDistance, PongHeight / 2 - this.paddleHeight),
			end: new Vector(PongWidth - this.paddleDistance, PongHeight / 2 + this.paddleHeight),
			radius: this.paddleRadius,
			constrains: new Vector(this.paddleHeight + this.paddleRadius + this.ballRadius, PongHeight - this.paddleHeight - this.paddleRadius - this.ballRadius),
		});
		this.leftPaddle = new Paddle({
			start: new Vector(this.paddleDistance, PongHeight / 2 - this.paddleHeight),
			end: new Vector(this.paddleDistance, PongHeight / 2 + this.paddleHeight),
			radius: this.paddleRadius,
			constrains: new Vector(this.paddleHeight + this.paddleRadius + this.ballRadius, PongHeight - this.paddleHeight - this.paddleRadius - this.ballRadius),
		});
		this.setup();
		setTimeout(() => (this.wait = true), 1000);
	}
	setup(): void {
		let angle: number = randInt((-Math.PI / 4) * 1000, (Math.PI / 4) * 1000) / 1000;
		if (this.playerNoBan === 3 || this.playerNoBan === 4) angle += Math.PI;
		// * Create ball
		this.ball = new Ball({
			pos: new Vector(PongWidth / 2, PongHeight / 2),
			radius: this.ballRadius,
			velocity: new Vector(1 * Math.cos(angle), 1 * Math.sin(angle)).unit(),
		});
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

	upddateBall(): BallState {
		if (this.collision_ball_paddle(this.ball, this.rightPaddle)) {
			this.penetration_resolution_ball_paddle(this.ball, this.rightPaddle);
			this.collision_response_ball_paddle(this.ball, this.rightPaddle);
		}
		if (this.collision_ball_paddle(this.ball, this.leftPaddle)) {
			this.penetration_resolution_ball_paddle(this.ball, this.leftPaddle);
			this.collision_response_ball_paddle(this.ball, this.leftPaddle);
		}
		if (this.collision_detection_ball_wall(this.ball, this.TopWall)) {
			this.penetration_resolution_ball_wall(this.ball, this.TopWall);
			this.collision_response_ball_wall(this.ball, this.TopWall);
		}
		if (this.collision_detection_ball_wall(this.ball, this.BottomWall)) {
			this.penetration_resolution_ball_wall(this.ball, this.BottomWall);
			this.collision_response_ball_wall(this.ball, this.BottomWall);
		}
		if (this.wait) this.ball.reposition();
		if (this.collision_detection_ball_wall(this.ball, this.RightWall)) return BallState.OUT_RIGHT;
		if (this.collision_detection_ball_wall(this.ball, this.LeftWall)) return BallState.OUT_LEFT;
		return BallState.IN;
	}
	updatePaddles(): void {
		if (this.collision_ball_paddle(this.ball, this.rightPaddle)) {
			this.penetration_resolution_ball_paddle(this.ball, this.rightPaddle);
			this.collision_response_ball_paddle(this.ball, this.rightPaddle);
		}
		if (this.collision_ball_paddle(this.ball, this.leftPaddle)) {
			this.penetration_resolution_ball_paddle(this.ball, this.leftPaddle);
			this.collision_response_ball_paddle(this.ball, this.leftPaddle);
		}
		this.rightPaddle.reposition();
		this.leftPaddle.reposition();
	}

	// * Collisions
	closestPointOnLineSigment(point: Vector, wall: Wall): Vector {
		// * check if the ball is before the line segment
		const ballToWallStart = wall.start.subtr(point);
		if (Vector.dot(wall.dir, ballToWallStart) > 0) return wall.start;
		// * check if the ball is after the line segment
		const wallEndToBall = point.subtr(wall.end);
		if (Vector.dot(wall.dir, wallEndToBall) > 0) return wall.end;
		// * check if the ball is inside the line segment
		const closestDist = Vector.dot(wall.dir, ballToWallStart);
		const closestVect = wall.dir.mult(closestDist);
		return wall.start.subtr(closestVect);
	}

	// * Collision Ball Wall
	collision_detection_ball_wall(ball: Ball, wall: Wall): boolean {
		const ballToClosest = this.closestPointOnLineSigment(ball.pos, wall).subtr(ball.pos);
		const penVect = ball.pos.subtr(this.closestPointOnLineSigment(ball.pos, wall));
		if (Vector.dot(penVect, wall.dir.normal()) < 0) return true;
		if (ballToClosest.mag() <= ball.radius) return true;
		return false;
	}
	penetration_resolution_ball_wall(ball: Ball, wall: Wall): void {
		let penVect = ball.pos.subtr(this.closestPointOnLineSigment(ball.pos, wall));
		if (Vector.dot(penVect, wall.dir.normal()) < 0) penVect = penVect.normal().normal();
		ball.pos = ball.pos.add(penVect.unit().mult(ball.radius - penVect.mag()));
	}
	collision_response_ball_wall(ball: Ball, wall: Wall): void {
		const normal = ball.pos.subtr(this.closestPointOnLineSigment(ball.pos, wall)).unit();
		ball.velocity = ball.velocity.subtr(normal.mult(2 * Vector.dot(ball.velocity, normal)));
		this.sound = true;
	}

	// * Collision Ball Paddle
	collision_ball_paddle(ball: Ball, paddle: Paddle): boolean {
		const wall = new Wall({ start: paddle.start, end: paddle.end });
		const ballToClosest = this.closestPointOnLineSigment(ball.pos, wall);
		const distance = ballToClosest.subtr(ball.pos).mag();
		if (distance < paddle.radius + ball.radius) return true;
		return false;
	}
	penetration_resolution_ball_paddle(ball: Ball, paddle: Paddle): void {
		const wall = new Wall({ start: paddle.start, end: paddle.end });
		const penVect = ball.pos.subtr(this.closestPointOnLineSigment(ball.pos, wall));
		ball.pos = ball.pos.add(penVect.unit().mult(ball.radius + paddle.radius - penVect.mag()));
	}
	collision_response_ball_paddle(ball: Ball, paddle: Paddle): void {
		const wall = new Wall({ start: paddle.start, end: paddle.end });
		const normal = ball.pos.subtr(this.closestPointOnLineSigment(ball.pos, wall)).unit();
		ball.velocity = ball.velocity.subtr(normal.mult(Vector.dot(ball.velocity, normal)).mult(2)).mult(1 + paddle.acc.unit().mag() * 0.2);
		if (ball.velocity.mag() > 2) ball.velocity = ball.velocity.unit().mult(2);
		if (Math.abs(ball.velocity.y) > Math.abs(ball.velocity.x)) {
			const x = ball.velocity.x;
			ball.velocity.x = ball.velocity.y;
			ball.velocity.y = x;
		}
		this.sound = true;
	}

	// * Main Frame
	update(): boolean {
		if (this.winner !== '') return true;
		if (this.sound === true) this.sound = false;
		this.updatePaddles();
		const ballState: BallState = this.upddateBall();
		if (ballState === BallState.OUT_RIGHT) {
			this.opponentScore += 1;
			this.playerNoBan += 1;
			this.wait = false;
			this.setup();
			setTimeout(() => (this.wait = true), 1000);
		} else if (ballState === BallState.OUT_LEFT) {
			this.playerScore += 1;
			this.playerNoBan += 1;
			this.wait = false;
			this.setup();
			setTimeout(() => (this.wait = true), 1000);
		}
		if (this.playerScore >= 7) this.winner = this.opponent;
		else if (this.opponentScore >= 7) this.winner = this.player;
		if (this.playerNoBan >= 5) this.playerNoBan = 1;
		return false;
	}
}

// ! END
