import { Ball, Vector, Paddle } from './pong.js';
import { mdb, Player } from './mdb.js';
import { WebSocket } from 'ws';

declare module 'ws' {
	interface WebSocket {
		PLAYFREE: boolean;
		username: string;
		hash: string;
	}
}

import _ from 'lodash';

// ! shared ------------------------------------------------------------------------------------------

interface MessageProps {
	username: string;
	message: string;
	hash: string;
	data: any;
}
export class Message {
	public username: string;
	public message: string;
	public hash: string;
	public data: string;
	constructor({ username, hash, message, data }: MessageProps) {
		this.data = JSON.stringify(data);
		this.username = username;
		this.message = message;
		this.hash = hash;
	}
	static instance = new Message({ username: '', hash: '', message: '', data: {} });
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

export class Play {
	public game: string;
	constructor(game: string) {
		this.game = game;
	}
	static instance = new Play('');
}

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
	public paddleHeight: number;
	public leftPaddlePosX: number;
	public leftPaddlePosY: number;
	public rightPaddlePosX: number;
	public rightPaddlePosY: number;
	constructor(ball: Ball, rightPaddle: Paddle, leftPaddle: Paddle) {
		this.ballRadius = Math.ceil(ball.radius);
		this.paddleRadius = Math.ceil(rightPaddle.radius);
		this.ballX = Math.ceil(ball.pos.x);
		this.ballY = Math.ceil(ball.pos.y);
		this.rightPaddlePosX = Math.ceil(rightPaddle.pos.x);
		this.rightPaddlePosY = Math.ceil(rightPaddle.pos.y);
		this.leftPaddlePosX = Math.ceil(leftPaddle.pos.x);
		this.leftPaddlePosY = Math.ceil(leftPaddle.pos.y);
		this.paddleHeight = Math.ceil(rightPaddle.length);
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
	img: string;
	page: string;
	query: string;
	constructor(img: string, page: string, query: string) {
		this.query = query;
		this.page = page;
		this.img = img;
	}
	public static instance = new Connect('', '', '');
}

export class Disconnect {
	page: string;
	constructor(page: string) {
		this.page = page;
	}
	public static instance = new Disconnect('');
}

export class Invite {
	recipient: string;
	constructor(recipient: string) {
		this.recipient = recipient;
	}
	public static instance = new Invite('');
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
	ErrorMessage(username: string, hash: string, error: string): string {
		return JSON.stringify(new Message({ username, hash, message: 'ERROR', data: new WSError(error) }));
	}

	// * POOL
	HashMessage(username: string, hash: string, img: string): string {
		return JSON.stringify(new Message({ username, hash, message: 'HASH', data: new Hash(username, img, hash) }));
	}
	PlayMessage(username: string, hash: string, game: string): string {
		return JSON.stringify(new Message({ username, hash, message: 'PLAY', data: new Play(game) }));
	}
	PoolMessage(username: string, hash: string, getClientPlayers: () => ClientPlayer[]): string {
		return JSON.stringify(new Message({ username, hash, message: 'POOL', data: new Pool(getClientPlayers()) }));
	}
	InvitationMessage(username: string, hash: string, getInvitions: () => ClientInvitation[]): string {
		return JSON.stringify(new Message({ username, hash, message: 'INVITATIONS', data: new Invitations(getInvitions()) }));
	}
	// * GAME
	StartMessage(username: string, hash: string): string {
		return JSON.stringify(new Message({ username, hash, message: 'START', data: new Start() }));
	}
	StopMessage(username: string, hash: string): string {
		return JSON.stringify(new Message({ username, hash, message: 'STOP', data: new Stop() }));
	}
	FrameMessage(username: string, hash: string, frame: Frame): string {
		return JSON.stringify(new Message({ username, hash, message: 'FRAME', data: frame }));
	}
	ScoreMessage(username: string, hash: string, player: number, opponent: number): string {
		return JSON.stringify(new Message({ username, hash, message: 'SCORE', data: new Score(player, opponent) }));
	}
	LostMessage(username: string, hash: string): string {
		return JSON.stringify(new Message({ username, hash, message: 'LOST', data: new Lost() }));
	}
	WonMessage(username: string, hash: string): string {
		return JSON.stringify(new Message({ username, hash, message: 'WON', data: new Won() }));
	}

	/************************************************************************************************************************
	 *                                                        PARSER                                                        *
	 ************************************************************************************************************************/
	useParser(json: string, socket: WebSocket) {
		const { username, message, hash, data } = this.Json({ message: json, target: Message.instance });
		if (message !== "CONNECT" && hash !== mdb.getPlayerHash(username)) throw new Error('hash mismatch ' + mdb.getPlayerHash(username) + ' ' + hash);
		switch (message) {
			case 'CONNECT':
				const connect: Connect = this.Json({ message: data, target: Connect.instance });
				const player: Player = mdb.createPlayer(username, connect.img, socket);
				switch (connect.page) {
					case 'MAIN': {
						mdb.addPlayer(player);
						break;
					}
					case 'GAME': {
						mdb.connectPlayer(player, connect.query);
						break;
					}
					default:
						break;
				}
				player.socket.send(WS.HashMessage(player.username, player.socket.hash, player.img));
				break;
			case 'DISCONNECT': {
				const disconnect: Disconnect = this.Json({ message: data, target: Disconnect.instance });
				switch (disconnect.page) {
					case 'MAIN': {
						mdb.removePlayer(username);
						break;
					}
					case 'GAME': {
						mdb.disconnectPlayer(username);
						break;
					}
					default:
						break;
				}
				break;
			}
			case 'INVITE': {
				const invite: Invite = this.Json({ message: data, target: Invite.instance });
				console.log('INVITE', username, invite);
				mdb.createInvitation(username, invite.recipient);
				break;
			}
			case 'ACCEPT': {
				const invite: Invite = this.Json({ message: data, target: Invite.instance });
				console.log('ACCEPT', username, invite);
				mdb.acceptInvitation(invite.recipient, username);
				break;
			}
			case 'REJECT': {
				const invite: Invite = this.Json({ message: data, target: Invite.instance });
				console.log('REJECT', username, invite);
				mdb.declineInvitation(invite.recipient, username);
				break;
			}
			case 'DELETE': {
				const invite: Invite = this.Json({ message: data, target: Invite.instance });
				console.log('DELETE', username, invite);
				if (invite.recipient === '*') mdb.deleteAllRejectedInvitations(username);
				else mdb.deleteRejectedInvitation(invite.recipient, username);
				break;
			}
			case 'HOOK': {
				const h: Hook = this.Json({ message: data, target: Hook.instance });
				mdb.roomHook(username, h);
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
			mdb.updateRooms();
		}, 1000 / 60);
	}
}

export const WS = new WSS();

export function transformFrame(f: Frame, width: number, height: number): Frame {
	return {
		...f,
		ballY: f.ballY,
		ballX: width - f.ballX,
		ballRadius: f.ballRadius,
		paddleHeight: f.paddleHeight,
		paddleRadius: f.paddleRadius,
		leftPaddlePosY: f.leftPaddlePosY,
		rightPaddlePosY: f.rightPaddlePosY,
		leftPaddlePosX: width - f.leftPaddlePosX,
		rightPaddlePosX: width - f.rightPaddlePosX,
	};
}
