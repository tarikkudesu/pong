import { Paddle } from './Paddle.js';
import { Ball } from './Ball.js';
import { Vector } from './Vector.js';
import { Wall } from './Wall.js';
const friction = 0.05;
export function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
export var BallState;
(function (BallState) {
    BallState[BallState["IN"] = 1] = "IN";
    BallState[BallState["OUT_RIGHT"] = 2] = "OUT_RIGHT";
    BallState[BallState["OUT_LEFT"] = 3] = "OUT_LEFT";
})(BallState || (BallState = {}));
class Keys {
    constructor() {
        this.UP_R = false;
        this.DOWN_R = false;
        this.UP_L = false;
        this.DOWN_L = false;
    }
}
export class Pong {
    constructor() {
        this.keys = new Keys();
        this.width = 1024; // * Customizable
        this.height = 768; // * Customizable
        this.ballRadius = 10; // * Customizable
        this.paddleHeight = 60; // * Customizable
        this.paddleRadius = 10; // * Customizable
        this.paddleDistance = 15; // * Customizable
        this.TopWall = new Wall({ start: new Vector(0, 0), end: new Vector(0, 0) });
        this.RightWall = new Wall({ start: new Vector(0, 0), end: new Vector(0, 0) });
        this.BottomWall = new Wall({ start: new Vector(0, 0), end: new Vector(0, 0) });
        this.LeftWall = new Wall({ start: new Vector(0, 0), end: new Vector(0, 0) });
        this.ball = new Ball({ pos: new Vector(0, 0), radius: 0, velocity: new Vector(0, 0) });
        this.rightPaddle = new Paddle({ start: new Vector(0, 0), end: new Vector(0, 0), radius: 0, constrains: new Vector(0, 0) });
        this.leftpaddle = new Paddle({ start: new Vector(0, 0), end: new Vector(0, 0), radius: 0, constrains: new Vector(0, 0) });
        // * Create Walls
        this.TopWall = new Wall({ start: new Vector(5, 0), end: new Vector(this.width - 5, 0) });
        this.RightWall = new Wall({ start: new Vector(this.width - 5, 0), end: new Vector(this.width - 5, this.height) });
        this.BottomWall = new Wall({ start: new Vector(this.width - 5, this.height), end: new Vector(0, this.height) });
        this.LeftWall = new Wall({ start: new Vector(5, this.height), end: new Vector(5, 0) });
        // * Create Paddles
        this.rightPaddle = new Paddle({
            start: new Vector(this.width - this.paddleDistance, this.height / 2 - this.paddleHeight),
            end: new Vector(this.width - this.paddleDistance, this.height / 2 + this.paddleHeight),
            radius: this.paddleRadius,
            constrains: new Vector(this.paddleHeight + this.paddleRadius + this.ballRadius * 2, this.height - this.paddleHeight - this.paddleRadius - this.ballRadius),
        });
        this.leftpaddle = new Paddle({
            start: new Vector(this.paddleDistance, this.height / 2 - this.paddleHeight),
            end: new Vector(this.paddleDistance, this.height / 2 + this.paddleHeight),
            radius: this.paddleRadius,
            constrains: new Vector(this.paddleHeight + this.paddleRadius + this.ballRadius * 2, this.height - this.paddleHeight - this.paddleRadius - this.ballRadius),
        });
    }
    setup(angle) {
        // * Create ball
        this.ball = new Ball({
            pos: new Vector(this.width / 2, this.height / 2),
            radius: this.ballRadius,
            velocity: new Vector(1 * Math.cos(angle), 1 * Math.sin(angle)).unit(),
        });
    }
    keyPressRight(up, down) {
        if (up)
            this.keys.UP_R = true;
        else
            this.keys.UP_R = false;
        if (down)
            this.keys.DOWN_R = true;
        else
            this.keys.DOWN_R = false;
        this.rightPaddle.move(up, down);
    }
    keyPressLeft(up, down) {
        if (up)
            this.keys.UP_R = true;
        else
            this.keys.UP_R = false;
        if (down)
            this.keys.DOWN_R = true;
        else
            this.keys.DOWN_R = false;
        this.leftpaddle.move(up, down);
    }
    upddateBall() {
        if (this.collision_ball_paddle(this.ball, this.rightPaddle)) {
            this.penetration_resolution_ball_paddle(this.ball, this.rightPaddle);
            this.collision_response_ball_paddle(this.ball, this.rightPaddle);
        }
        if (this.collision_ball_paddle(this.ball, this.leftpaddle)) {
            this.penetration_resolution_ball_paddle(this.ball, this.leftpaddle);
            this.collision_response_ball_paddle(this.ball, this.leftpaddle);
        }
        if (this.collision_detection_ball_wall(this.ball, this.TopWall)) {
            this.penetration_resolution_ball_wall(this.ball, this.TopWall);
            this.collision_response_ball_wall(this.ball, this.TopWall);
        }
        if (this.collision_detection_ball_wall(this.ball, this.BottomWall)) {
            this.penetration_resolution_ball_wall(this.ball, this.BottomWall);
            this.collision_response_ball_wall(this.ball, this.BottomWall);
        }
        this.ball.reposition();
        if (this.collision_detection_ball_wall(this.ball, this.RightWall))
            return BallState.OUT_RIGHT;
        if (this.collision_detection_ball_wall(this.ball, this.LeftWall))
            return BallState.OUT_LEFT;
        return BallState.IN;
    }
    updatePaddles() {
        if (this.collision_ball_paddle(this.ball, this.rightPaddle)) {
            this.penetration_resolution_ball_paddle(this.ball, this.rightPaddle);
            this.collision_response_ball_paddle(this.ball, this.rightPaddle);
        }
        if (this.collision_ball_paddle(this.ball, this.leftpaddle)) {
            this.penetration_resolution_ball_paddle(this.ball, this.leftpaddle);
            this.collision_response_ball_paddle(this.ball, this.leftpaddle);
        }
        this.rightPaddle.reposition();
        this.leftpaddle.reposition();
    }
    // * Collisions
    closestPointOnLineSigment(point, wall) {
        // * check if the ball is before the line segment
        const ballToWallStart = wall.start.subtr(point);
        if (Vector.dot(wall.dir, ballToWallStart) > 0)
            return wall.start;
        // * check if the ball is after the line segment
        const wallEndToBall = point.subtr(wall.end);
        if (Vector.dot(wall.dir, wallEndToBall) > 0)
            return wall.end;
        // * check if the ball is inside the line segment
        const closestDist = Vector.dot(wall.dir, ballToWallStart);
        const closestVect = wall.dir.mult(closestDist);
        return wall.start.subtr(closestVect);
    }
    // * Collision Ball Wall
    collision_detection_ball_wall(ball, wall) {
        const ballToClosest = this.closestPointOnLineSigment(ball.pos, wall).subtr(ball.pos);
        const penVect = ball.pos.subtr(this.closestPointOnLineSigment(ball.pos, wall));
        if (Vector.dot(penVect, wall.dir.normal()) < 0)
            return true;
        if (ballToClosest.mag() <= ball.radius)
            return true;
        return false;
    }
    penetration_resolution_ball_wall(ball, wall) {
        let penVect = ball.pos.subtr(this.closestPointOnLineSigment(ball.pos, wall));
        if (Vector.dot(penVect, wall.dir.normal()) < 0)
            penVect = penVect.normal().normal();
        ball.pos = ball.pos.add(penVect.unit().mult(ball.radius - penVect.mag()));
    }
    collision_response_ball_wall(ball, wall) {
        const normal = ball.pos.subtr(this.closestPointOnLineSigment(ball.pos, wall)).unit();
        ball.velocity = ball.velocity.subtr(normal.mult(2 * Vector.dot(ball.velocity, normal)));
    }
    // * Collision Ball Paddle
    collision_ball_paddle(ball, paddle) {
        const wall = new Wall({ start: paddle.start, end: paddle.end });
        const ballToClosest = this.closestPointOnLineSigment(ball.pos, wall);
        const distance = ballToClosest.subtr(ball.pos).mag();
        if (distance < paddle.radius + ball.radius)
            return true;
        return false;
    }
    penetration_resolution_ball_paddle(ball, paddle) {
        const wall = new Wall({ start: paddle.start, end: paddle.end });
        const penVect = ball.pos.subtr(this.closestPointOnLineSigment(ball.pos, wall));
        ball.pos = ball.pos.add(penVect.unit().mult(ball.radius + paddle.radius - penVect.mag()));
    }
    collision_response_ball_paddle(ball, paddle) {
        const wall = new Wall({ start: paddle.start, end: paddle.end });
        const normal = ball.pos.subtr(this.closestPointOnLineSigment(ball.pos, wall)).unit();
        ball.velocity = ball.velocity.subtr(normal.mult(Vector.dot(ball.velocity, normal)).mult(2)).mult(1 + paddle.acc.unit().mag() * 0.2);
        if (ball.velocity.mag() > 2)
            ball.velocity = ball.velocity.unit().mult(2);
        if (Math.abs(ball.velocity.y) > Math.abs(ball.velocity.x)) {
            const x = ball.velocity.x;
            ball.velocity.x = ball.velocity.y;
            ball.velocity.y = x;
        }
    }
    // * Collision Paddle Ball
    // * Main Frame
    updateFrame() {
        this.updatePaddles();
        return this.upddateBall();
    }
}
