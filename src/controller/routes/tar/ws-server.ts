import { Ball, Vector, Paddle, PongWidth } from './pong.js';
import { mdb, Player } from './mdb.js';
import { WebSocket } from 'ws';

import _ from 'lodash';

declare module 'ws' {
	interface WebSocket {
		PLAYFREE: boolean;
		username: string;
		hash: string;
	}
}

// ! shared ------------------------------------------------------------------------------------------

interface MessageProps {
	username: string;
	message: string;
	hash: string;
	game: 'pong' | 'card of doom';
	data: any;
}
export class Message {
	public username: string;
	public message: string;
	public hash: string;
	public data: any;
	public game: 'pong' | 'card of doom';
	constructor({ username, hash, message, data, game }: MessageProps) {
		this.data = JSON.stringify(data);
		this.username = username;
		this.message = message;
		this.hash = hash;
		this.game = game;
	}
	static instance = new Message({ username: '', hash: '', message: '', data: {}, game: 'pong' });
}
export class WSError {
	public message: string;
	constructor(error: string) {
		this.message = error;
	}
	static instance = new WSError('');
}

export class Hash {
	public hash: string;
	public username: string;
	constructor(username: string, hash: string) {
		this.username = username;
		this.hash = hash;
	}
	static instance = new Hash('', '');
}

export class ClientPlayer {
	public username: string;
	public game: 'pong' | 'card of doom';
	public invite_status: 'unsent' | 'pending' | 'accepted' | 'declined';
	constructor(username: string, game: 'pong' | 'card of doom', invite_status: 'unsent' | 'pending' | 'accepted' | 'declined') {
		this.invite_status = invite_status;
		this.username = username;
		this.game = game;
	}
	static instance = new ClientPlayer('', 'pong', 'unsent');
}

export class ClientInvitation {
	public sender: string;
	public game: 'pong' | 'card of doom';
	public invite_status: 'unsent' | 'pending' | 'accepted' | 'declined';
	constructor(sender: string, game: 'pong' | 'card of doom', invite_status: 'unsent' | 'pending' | 'accepted' | 'declined') {
		this.invite_status = invite_status;
		this.sender = sender;
		this.game = game;
	}
	static instance = new ClientInvitation('', 'pong', 'unsent');
}

// ! res ------------------------------------------------------------------------------------------

// * Pool

export class Play {
	public gid: string;
	constructor(gid: string) {
		this.gid = gid;
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

interface ClientPongProps {
	start: boolean;
	stop: boolean;
	won: boolean;
	lost: boolean;
	playerScore: number;
	opponentScore: number;
	rightPaddle: Paddle;
	leftPaddle: Paddle;
	ball: Ball;
}

export class ClientPong {
	public playerScore: number;
	public opponentScore: number;
	public start: boolean = false;
	public stop: boolean = false;
	public lost: boolean = false;
	public won: boolean = false;
	public ballX: number;
	public ballY: number;
	public ballRadius: number;
	public paddleRadius: number;
	public paddleHeight: number;
	public leftPaddlePosX: number;
	public leftPaddlePosY: number;
	public rightPaddlePosX: number;
	public rightPaddlePosY: number;
	constructor({ playerScore, opponentScore, ball, rightPaddle, leftPaddle, start, stop, won, lost }: ClientPongProps) {
		this.playerScore = playerScore;
		this.opponentScore = opponentScore;
		this.ballX = Math.ceil(ball.pos.x);
		this.ballY = Math.ceil(ball.pos.y);
		this.ballRadius = Math.ceil(ball.radius);
		this.paddleRadius = Math.ceil(rightPaddle.radius);
		this.rightPaddlePosX = Math.ceil(rightPaddle.pos.x);
		this.rightPaddlePosY = Math.ceil(rightPaddle.pos.y);
		this.leftPaddlePosX = Math.ceil(leftPaddle.pos.x);
		this.leftPaddlePosY = Math.ceil(leftPaddle.pos.y);
		this.paddleHeight = Math.ceil(rightPaddle.length);
		this.start = start !== undefined ? start : false;
		this.stop = stop !== undefined ? stop : false;
		this.lost = lost !== undefined ? lost : false;
		this.won = won !== undefined ? won : false;
	}
}

interface ClientCardOfDoomProps {
	won: boolean;
	stop: boolean;
	lost: boolean;
	timer: number;
	start: boolean;
	myturn: boolean;
	cards: string[];
	playerScore: number;
	opponentScore: number;
}

export class ClientCardOfDoom {
	public cards: string[];
	public playerScore: number;
	public opponentScore: number;
	public start: boolean = false;
	public stop: boolean = false;
	public lost: boolean = false;
	public won: boolean = false;
	public myturn: boolean;
	public timer: number;
	constructor({ cards, playerScore, opponentScore, myturn, timer, start, stop, lost, won }: ClientCardOfDoomProps) {
		this.opponentScore = opponentScore;
		this.playerScore = playerScore;
		this.myturn = myturn;
		this.timer = timer;
		this.start = start;
		this.cards = cards;
		this.stop = stop;
		this.lost = lost;
		this.won = won;
	}
}

// ! req -------------------------------------------------------------------------

// * Pool

export class Engage {
	gid: string;
	constructor(gid: string) {
		this.gid = gid;
	}
	public static instance = new Engage('');
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
	gid: string;
	up: boolean;
	down: boolean;
	constructor(gid: string, up: boolean, down: boolean) {
		this.up = up;
		this.gid = gid;
		this.down = down;
	}
	public static instance = new Hook('', false, false);
}

export class Flip {
	gid: string;
	pos: number;
	constructor(gid: string, pos: number) {
		this.gid = gid;
		this.pos = pos;
	}
	public static instance = new Flip('', 0);
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

	// ? Comminication Helpers
	Json({ message, target }: JsonProps) {
		const json = JSON.parse(message);
		const properties = Object.getOwnPropertyNames(json);
		Object.getOwnPropertyNames(target).forEach((property) => {
			if (_.includes(properties, property) === false) throw new Error('Invalid JSON');
		});
		return json;
	}

	// * OTHER : ERROR | NOTAUTHORIZED
	ErrorMessage(error: string) {
		return JSON.stringify(new Message({ username: '', hash: '', game: 'pong', message: 'ERROR', data: new WSError(error) }));
	}

	// * POOL : HASH | PLAY | POOL | INVITATIONS
	HashMessage(username: string, hash: string, game: 'pong' | 'card of doom'): string {
		return JSON.stringify(new Message({ username, hash, message: 'HASH', game, data: new Hash(username, hash) }));
	}
	PlayMessage(username: string, hash: string, game: 'pong' | 'card of doom', gid: string): string {
		return JSON.stringify(new Message({ username, hash, message: 'PLAY', game, data: new Play(gid) }));
	}
	PoolMessage(username: string, hash: string, game: 'pong' | 'card of doom', getClientPlayers: () => ClientPlayer[]): string {
		return JSON.stringify(new Message({ username, hash, message: 'POOL', game, data: new Pool(getClientPlayers()) }));
	}
	InvitationMessage(username: string, hash: string, game: 'pong' | 'card of doom', getInvitions: () => ClientInvitation[]): string {
		return JSON.stringify(new Message({ username, hash, message: 'INVITATIONS', game, data: new Invitations(getInvitions()) }));
	}

	// * GAME : PONG | CARDOFDOOM
	PongMessage(username: string, hash: string, game: 'pong' | 'card of doom', clientPong: ClientPong) {
		return JSON.stringify(new Message({ username, hash, message: 'PONG', game, data: clientPong }));
	}
	DoomMessage(username: string, hash: string, game: 'pong' | 'card of doom', clientCardOfDoom: ClientCardOfDoom) {
		return JSON.stringify(new Message({ username, hash, message: 'DOOM', game, data: clientCardOfDoom }));
	}

	/************************************************************************************************************************
	 *                                                        PARSER                                                        *
	 ************************************************************************************************************************/
	useParser(json: string, socket: WebSocket) {
		const { username, message, hash, game, data } = this.Json({ message: json, target: Message.instance });
		if (message !== 'CONNECT' && hash !== mdb.getPlayerHash(username))
			throw new Error('hash mismatch ' + hash + ' ' + mdb.getPlayerHash(username));
		console.log(username, message);
		switch (message) {
			case 'CONNECT':
				const player: Player = mdb.createPlayer(username, socket);
				mdb.addPlayer(player);
				player.socket.send(WS.HashMessage(player.username, player.socket.hash, 'pong'));
				break;
			case 'ENGAGE': {
				const engage: Engage = this.Json({ message: data, target: Engage.instance });
				mdb.connectPlayer(username, engage.gid, game);
				break;
			}
			case 'INVITE': {
				const invite: Invite = this.Json({ message: data, target: Invite.instance });
				mdb.createInvitation(username, invite.recipient, game);
				break;
			}
			case 'ACCEPT': {
				const invite: Invite = this.Json({ message: data, target: Invite.instance });
				mdb.acceptInvitation(invite.recipient, username);
				break;
			}
			case 'REJECT': {
				const invite: Invite = this.Json({ message: data, target: Invite.instance });
				mdb.declineInvitation(invite.recipient, username);
				break;
			}
			case 'DELETE': {
				const invite: Invite = this.Json({ message: data, target: Invite.instance });
				if (invite.recipient === '*') mdb.deleteAllRejectedInvitations(username);
				else mdb.deleteRejectedInvitation(invite.recipient, username);
				break;
			}
			case 'HOOK': {
				const h: Hook = this.Json({ message: data, target: Hook.instance });
				mdb.roomHook(username, h);
				break;
			}
			case 'FLIP': {
				const f: Flip = this.Json({ message: data, target: Flip.instance });
				mdb.roomFlip(username, f);
				break;
			}
			default:
				throw new Error('UNKNOWN COMMAND');
		}
	}
	closeSocket(socket: WebSocket) {
		if (socket.username) {
			mdb.cancelAllPlayerInvitations(socket.username);
			mdb.removePlayer(socket.username);
		}
	}
	main() {
		setInterval(() => {
			mdb.deleteExpiredInvitations();
			mdb.updateRooms();
			mdb.sendInvitations();
			mdb.sendPool();
		}, 1000 / 60);
	}
}

export const WS = new WSS();

export function transformFrame(f: ClientPong): ClientPong {
	return {
		...f,
		ballY: f.ballY,
		ballX: PongWidth - f.ballX,
		ballRadius: f.ballRadius,
		paddleHeight: f.paddleHeight,
		paddleRadius: f.paddleRadius,
		leftPaddlePosY: f.rightPaddlePosY,
		rightPaddlePosY: f.leftPaddlePosY,
		leftPaddlePosX: PongWidth - f.rightPaddlePosX,
		rightPaddlePosX: PongWidth - f.leftPaddlePosX,
	};
}
