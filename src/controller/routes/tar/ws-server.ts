import { Ball, Vector, Paddle } from './game/index.js';

import _ from 'lodash';

// ! shared ------------------------------------------------------------------------------------------
interface MessageProps {
	event: string;
	object: any;
}
export class Message {
	public message: string;
	public data: string;
	constructor({ event, object }: MessageProps) {
		this.message = event;
		this.data = JSON.stringify(object);
	}
	static instance = new Message({ event: '', object: {} });
}

export class Pooler {
	public username: string;
	public profile: string;
	constructor(username: string, profile: string) {
		this.username = username;
		this.profile = profile;
	}
	static instance = new Pooler('', '');
}

export class Invitation {
	public username: string = '';
	public img: string = '';
	public invite_status: string = '';
	constructor() {}
	static instance = new Invitation();
}

export class WSError {
	public message: string;
	constructor(error: string) {
		this.message = error;
	}
	static instance = new WSError('');
}

// ! res ------------------------------------------------------------------------------------------

// * Pool
export class Hash {
	public username: string;
	public img: string;
	public hash: string;
	constructor(username: string, img: string, hash: string) {
		this.username = username;
		this.hash = hash;
		this.img = img;
	}
	static instance = new Hash('', '', '');
}

export class Pool {
	public pool: Pooler[];
	constructor(pool: Pooler[]) {
		this.pool = pool;
	}
	static instance = new Pool([]);
}

export class Invitations {
	public invitations: Invitation[];
	constructor(invitations: Invitation[]) {
		this.invitations = invitations;
	}
	static instance = new Invitations([]);
}

// * Game
export class Start {
	public start: string;
	constructor() {
		this.start = 'START';
	}
	public static instance = new Start();
}

export class Stop {
	public stop: string;
	constructor() {
		this.stop = 'STOP';
	}
	public static instance = new Stop();
}

export class Frame {
	public ballX: number;
	public ballY: number;
	public ballRadius: number;
	public paddleRadius: number;
	public leftPaddleTopX: number;
	public leftPaddleTopY: number;
	public rightPaddleTopX: number;
	public rightPaddleTopY: number;
	public leftPaddleBottomX: number;
	public leftPaddleBottomY: number;
	public rightPaddleBottomX: number;
	public rightPaddleBottomY: number;
	constructor(ball: Ball, rightPaddle: Paddle, leftPaddle: Paddle) {
		this.ballRadius = Math.ceil(ball.radius);
		this.paddleRadius = Math.ceil(rightPaddle.radius);
		this.ballX = Math.ceil(ball.pos.x);
		this.ballY = Math.ceil(ball.pos.y);
		this.rightPaddleTopX = Math.ceil(rightPaddle.start.x);
		this.rightPaddleTopY = Math.ceil(rightPaddle.start.y);
		this.rightPaddleBottomX = Math.ceil(rightPaddle.end.x);
		this.rightPaddleBottomY = Math.ceil(rightPaddle.end.y);
		this.leftPaddleTopX = Math.ceil(leftPaddle.start.x);
		this.leftPaddleTopY = Math.ceil(leftPaddle.start.y);
		this.leftPaddleBottomX = Math.ceil(leftPaddle.end.x);
		this.leftPaddleBottomY = Math.ceil(leftPaddle.end.y);
	}
	static instance = new Frame(
		new Ball({ pos: new Vector(0, 0), radius: 0, velocity: new Vector(0, 0) }),
		new Paddle({ start: new Vector(0, 0), end: new Vector(0, 0), radius: 0, constrains: new Vector(0, 0) }),
		new Paddle({ start: new Vector(0, 0), end: new Vector(0, 0), radius: 0, constrains: new Vector(0, 0) })
	);
}

export class Score {
	public player: number;
	public opponent: number;
	constructor(player: number, opponent: number) {
		this.player = player;
		this.opponent = opponent;
	}
	static instance = new Score(0, 0);
}

export class Lost {
	public lost: string;
	constructor() {
		this.lost = 'LOST';
	}
	static instance = new Lost();
}

export class Won {
	public won: string;
	constructor() {
		this.won = 'WON';
	}
	static instance = new Won();
}
// ! req -------------------------------------------------------------------------

// * Pool
export class Connect {
	// TODO: initial game data can be added here
	username: string;
	img: string;
	page: string;
	query: string;
	constructor(username: string, img: string, page: string, query: string) {
		this.username = username;
		this.query = query;
		this.page = page;
		this.img = img;
	}
	public static instance = new Connect('', '', '', '');
}

export class Invite {
	sender: string;
	recipient: string;
	constructor(sender: string, recipient: string) {
		this.sender = sender;
		this.recipient = recipient;
	}
	public static instance = new Invite('', '');
}

export class Accept {
	sender: string;
	recipient: string;
	constructor(sender: string, recipient: string) {
		this.sender = sender;
		this.recipient = recipient;
	}
	public static instance = new Accept('', '');
}

export class Reject {
	sender: string;
	recipient: string;
	constructor(sender: string, recipient: string) {
		this.sender = sender;
		this.recipient = recipient;
	}
	public static instance = new Reject('', '');
}

export class Delete {
	sender: string;
	recipient: string;
	constructor(sender: string, recipient: string) {
		this.sender = sender;
		this.recipient = recipient;
	}
	public static instance = new Delete('', '');
}

// * Game
export class Hook {
	up: boolean;
	down: boolean;
	constructor(up: boolean, down: boolean) {
		this.up = up;
		this.down = down;
	}
	public static instance = new Hook(false, false);
}

// ! Protocole ------------------------------------------------------------------------------

interface JsonProps {
	message: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	target: any;
}
class WSS {
	private static instance: WSS | null;
	constructor() {
		if (WSS.instance) return WSS.instance;
		WSS.instance = this;
	}

	// * frame, start, stop, pool, score, won, lost, invitations, error

	// ? Comminication Helpers
	Json({ message, target }: JsonProps) {
		const json = JSON.parse(message);
		const properties = Object.getOwnPropertyNames(json);
		Object.getOwnPropertyNames(target).forEach((property) => {
			if (_.includes(properties, property) === false) throw new Error('Invalid JSON');
		});
		return json;
	}

	// ? Protocole Message Builders

	ErrorMessage(error: string) {
		return JSON.stringify(new Message({ event: 'ERROR', object: new WSError(error) }));
	}

	// * POOL
	HashMessage(username: string, img: string, hash: string): string {
		return JSON.stringify(new Message({ event: 'Hash', object: new Hash(username, img, hash) }));
	}
	PoolMessage(getPoolers: () => Pooler[]): string {
		return JSON.stringify(new Message({ event: 'POOL', object: new Pool(getPoolers()) }));
	}
	InvitationMessage(getInvitions: () => Invitation[]): string {
		return JSON.stringify(new Message({ event: 'INVITATIONS', object: new Invitations(getInvitions()) }));
	}
	// * GAME
	StartMessage(): string {
		return JSON.stringify(new Message({ event: 'START', object: new Start() }));
	}
	StopMessage(): string {
		return JSON.stringify(new Message({ event: 'STOP', object: new Stop() }));
	}
	FrameMessage(ball: Ball, rightPaddle: Paddle, leftPaddle: Paddle) {
		return JSON.stringify(new Message({ event: 'FRAME', object: new Frame(ball, rightPaddle, leftPaddle) }));
	}
	ScoreMessage(player: number, opponent: number): string {
		return JSON.stringify(new Message({ event: 'SCORE', object: new Score(player, opponent) }));
	}
	LostMessage(): string {
		return JSON.stringify(new Message({ event: 'LOST', object: new Lost() }));
	}
	WonMessage(): string {
		return JSON.stringify(new Message({ event: 'WON', object: new Won() }));
	}
}

export const WS = new WSS();
