import { Ball, Vector, Paddle } from './game/index.js';
import { mdb } from './mdb.js';
import { WebSocket } from 'ws';

declare module 'ws' {
	interface WebSocket {
		username: string;
		hash: string;
	}
}

import _ from 'lodash';

// ! shared ------------------------------------------------------------------------------------------

interface MessageProps {
	message: string;
	data: any;
}
export class Message {
	public message: string;
	public data: string;
	constructor({ message, data }: MessageProps) {
		this.message = message;
		this.data = JSON.stringify(data);
	}
	static instance = new Message({ message: '', data: {} });
}

export class WSError {
	public message: string;
	constructor(error: string) {
		this.message = error;
	}
	static instance = new WSError('');
}

export class Hash {
	public img: string;
	public hash: string;
	public username: string;
	constructor(username: string, img: string, hash: string) {
		this.username = username;
		this.hash = hash;
		this.img = img;
	}
	static instance = new Hash('', '', '');
}

export class ClientPlayer {
	public img: string;
	public username: string;
	public invite_status: 'unsent' | 'pending' | 'accepted' | 'declined';
	constructor(username: string, img: string, invite_status: 'unsent' | 'pending' | 'accepted' | 'declined') {
		this.invite_status = invite_status;
		this.username = username;
		this.img = img;
	}
	static instance = new ClientPlayer('', '', 'unsent');
}

export class ClientInvitation {
	public img: string;
	public sender: string;
	public invite_status: 'unsent' | 'pending' | 'accepted' | 'declined';
	constructor(sender: string, img: string, invite_status: 'unsent' | 'pending' | 'accepted' | 'declined') {
		this.invite_status = invite_status;
		this.sender = sender;
		this.img = img;
	}
	static instance = new ClientInvitation('', '', 'unsent');
}

// ! res ------------------------------------------------------------------------------------------

// * Pool

export class Pool {
	public pool: ClientPlayer[];
	constructor(pool: ClientPlayer[]) {
		this.pool = pool;
	}
	static instance = new Pool([]);
}

export class Invitations {
	public invitations: ClientInvitation[];
	constructor(invitations: ClientInvitation[]) {
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
	img: string;
	page: string;
	query: string;
	username: string;
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
		return JSON.stringify(new Message({ message: 'ERROR', data: new WSError(error) }));
	}

	// * POOL
	HashMessage(username: string, img: string, hash: string): string {
		return JSON.stringify(new Message({ message: 'Hash', data: new Hash(username, img, hash) }));
	}
	PoolMessage(getClientPlayers: () => ClientPlayer[]): string {
		return JSON.stringify(new Message({ message: 'POOL', data: new Pool(getClientPlayers()) }));
	}
	InvitationMessage(getInvitions: () => ClientInvitation[]): string {
		return JSON.stringify(new Message({ message: 'INVITATIONS', data: new Invitations(getInvitions()) }));
	}
	// * GAME
	StartMessage(): string {
		return JSON.stringify(new Message({ message: 'START', data: new Start() }));
	}
	StopMessage(): string {
		return JSON.stringify(new Message({ message: 'STOP', data: new Stop() }));
	}
	FrameMessage(ball: Ball, rightPaddle: Paddle, leftPaddle: Paddle) {
		return JSON.stringify(new Message({ message: 'FRAME', data: new Frame(ball, rightPaddle, leftPaddle) }));
	}
	ScoreMessage(player: number, opponent: number): string {
		return JSON.stringify(new Message({ message: 'SCORE', data: new Score(player, opponent) }));
	}
	LostMessage(): string {
		return JSON.stringify(new Message({ message: 'LOST', data: new Lost() }));
	}
	WonMessage(): string {
		return JSON.stringify(new Message({ message: 'WON', data: new Won() }));
	}

	/************************************************************************************************************************
	 *                                                        PARSER                                                        *
	 ************************************************************************************************************************/
	useParser(json: string, socket: WebSocket) {
		const { message, data } = this.Json({ message: json, target: Message.instance });
		switch (message) {
			case 'CONNECT': {
				// TODO: handle connect GAME
				// ? connect.page = 'MAIN' | 'GAME';
				const connect: Connect = this.Json({ message: data, target: Connect.instance });
				console.log("CONNECT", connect);
				if (connect.page === 'MAIN') mdb.addPlayer(connect.username, connect.img, socket);
				break;
			}
			case 'INVITE': {
				// TODO: handle invite
				const invite: Invite = this.Json({ message: data, target: Invite.instance });
				console.log("INVITE", invite);
				mdb.createInvitation(invite.sender, invite.recipient);
				break;
			}
			case 'ACCEPT': {
				// TODO: handle accept
				const invite: Invite = this.Json({ message: data, target: Invite.instance });
				console.log("ACCEPT", invite);
				mdb.acceptInvitation(invite.sender, invite.recipient);
				break;
			}
			case 'REJECT': {
				// TODO: handle reject
				const invite: Invite = this.Json({ message: data, target: Invite.instance });
				console.log("REJECT", invite);
				mdb.declineInvitation(invite.sender, invite.recipient);
				break;
			}
			case 'DELETE': {
				// TODO: handle delete
				const invite: Invite = this.Json({ message: data, target: Invite.instance });
				console.log("DELETE", invite);
				if (invite.recipient === '*') mdb.deleteAllRejectedInvitations(invite.sender);
				else mdb.deleteRejectedInvitation(invite.sender, invite.recipient);
				break;
			}
			default:
				throw new Error('Invalid JSON');
		}
		mdb.updateClient();
	}
	closeSocket(socket: WebSocket) {
		if (socket.username) {
			mdb.removePlayer(socket.username);
			mdb.cancelAllPlayerInvitations(socket.username);
		}
		mdb.updateClient();
	}
	main() {
		setInterval(() => {
			mdb.updateMdb();
			mdb.updateClient();
		}, 1000 / 60);
	}
}

export const WS = new WSS();
