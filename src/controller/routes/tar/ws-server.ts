import { GameTYPE, PlayerStateTYPE, InvitationStateTYPE, mdb, Player, Room, Ball, Paddle, PongWidth, TournamentStateTYPE, TournamentPlayerTYPE, ClientTournamentMatchTYPE } from './index.js';
import { WebSocket } from 'ws';

import _ from 'lodash';

// ! shared ------------------------------------------------------------------------------------------

interface MessageProps {
	username: string;
	message: string;
	hash: string;
	game: GameTYPE;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: any;
}
export class Message {
	public username: string;
	public message: string;
	public hash: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public data: any;
	public game: GameTYPE;
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
	public game: GameTYPE;
	public playerStatus: PlayerStateTYPE;
	public inviteStatus: InvitationStateTYPE;
	constructor(username: string, game: GameTYPE, playerStatus: PlayerStateTYPE, inviteStatus: InvitationStateTYPE) {
		this.inviteStatus = inviteStatus;
		this.playerStatus = playerStatus;
		this.username = username;
		this.game = game;
	}
	static instance = new ClientPlayer('', 'pong', 'free', 'unsent');
}

export class ClientInvitation {
	public sender: string;
	public game: GameTYPE;
	public inviteStatus: InvitationStateTYPE;
	constructor(sender: string, game: GameTYPE, inviteStatus: InvitationStateTYPE) {
		this.inviteStatus = inviteStatus;
		this.sender = sender;
		this.game = game;
	}
	static instance = new ClientInvitation('', 'pong', 'unsent');
}

interface ClientTournamentProps {
	gid: string;
	name: string;
	date: string;
	round: number;
	emptySlots: number;
	registered: boolean;
	state: TournamentStateTYPE;
	results: TournamentPlayerTYPE[];
	nextMatches: ClientTournamentMatchTYPE[];
}
export class ClientTournament {
	public gid: string;
	public date: string;
	public name: string;
	public round: number;
	public emptySlots: number;
	public registered: boolean;
	public state: TournamentStateTYPE;
	public results: TournamentPlayerTYPE[];
	public nextMatches: ClientTournamentMatchTYPE[];
	constructor({ name, date, emptySlots, state, results, registered, nextMatches, round, gid }: ClientTournamentProps) {
		this.nextMatches = nextMatches;
		this.registered = registered;
		this.emptySlots = emptySlots;
		this.results = results;
		this.state = state;
		this.round = round;
		this.date = date;
		this.name = name;
		this.gid = gid;
	}
	static instance = new ClientTournament({ name: '', date: '', emptySlots: 0, registered: false, state: 'not open', results: [], nextMatches: [], round: 0, gid: '' });
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
	sound: boolean;
	start: boolean;
	stop: boolean;
	won: boolean;
	lost: boolean;
	playerScore: number;
	opponentScore: number;
	rightPaddle: Paddle;
	leftPaddle: Paddle;
	tinychat: string;
	ball: Ball;
}

export class ClientPong {
	public sound: boolean;
	public tinychat: string;
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
	constructor({ playerScore, opponentScore, ball, rightPaddle, leftPaddle, start, stop, won, lost, tinychat, sound }: ClientPongProps) {
		this.sound = sound;
		this.tinychat = tinychat;
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

interface ClientCardOfDoomProps {
	won: boolean;
	stop: boolean;
	lost: boolean;
	timer: number;
	start: boolean;
	myturn: boolean;
	tinychat: string;
	cards: string[];
}

export class ClientCardOfDoom {
	public tinychat: string;
	public cards: string[];
	public start: boolean = false;
	public stop: boolean = false;
	public lost: boolean = false;
	public won: boolean = false;
	public myturn: boolean;
	public timer: number;
	constructor({ cards, myturn, timer, start, stop, lost, won, tinychat }: ClientCardOfDoomProps) {
		this.tinychat = tinychat;
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

export class Register {
	alias: string;
	constructor(alias: string) {
		this.alias = alias;
	}
	public static instance = new Register('');
}
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

export class TinyChat {
	public gid: string;
	public message: string;
	constructor(message: string, gid: string) {
		this.message = message;
		this.gid = gid;
	}
	public static instance = new TinyChat('', '');
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

// ? Comminication Helpers
export function Json({ message, target }: JsonProps) {
	const json = JSON.parse(message);
	const properties = Object.getOwnPropertyNames(json);
	Object.getOwnPropertyNames(target).forEach((property) => {
		if (_.includes(properties, property) === false) throw new Error('Invalid JSON');
	});
	return json;
}

// * OTHER : ERROR
export function ErrorMessage(error: string) {
	return JSON.stringify(new Message({ username: '', hash: '', game: 'pong', message: 'ERROR', data: new WSError(error) }));
}

// * POOL : HASH | PLAY | POOL | INVITATIONS
export function HashMessage(username: string, hash: string, game: GameTYPE): string {
	return JSON.stringify(new Message({ username, hash, message: 'HASH', game, data: new Hash(username, hash) }));
}
export function PlayMessage(username: string, hash: string, game: GameTYPE, gid: string): string {
	return JSON.stringify(new Message({ username, hash, message: 'PLAY', game, data: new Play(gid) }));
}
export function PoolMessage(username: string, hash: string, game: GameTYPE, getClientPlayers: () => ClientPlayer[]): string {
	return JSON.stringify(new Message({ username, hash, message: 'POOL', game, data: new Pool(getClientPlayers()) }));
}
export function InvitationMessage(username: string, hash: string, game: GameTYPE, getInvitions: () => ClientInvitation[]): string {
	return JSON.stringify(new Message({ username, hash, message: 'INVITATIONS', game, data: new Invitations(getInvitions()) }));
}
export function TournamentMessage(username: string, hash: string, game: GameTYPE, clientTournament: ClientTournament): string {
	return JSON.stringify(new Message({ username, hash, message: 'TOURNAMENT', game, data: clientTournament }));
}
// * GAME : PONG | CARDOFDOOM
export function PongMessage(username: string, hash: string, game: GameTYPE, clientPong: ClientPong) {
	return JSON.stringify(new Message({ username, hash, message: 'PONG', game, data: clientPong }));
}
export function DoomMessage(username: string, hash: string, game: GameTYPE, clientCardOfDoom: ClientCardOfDoom) {
	return JSON.stringify(new Message({ username, hash, message: 'DOOM', game, data: clientCardOfDoom }));
}

/************************************************************************************************************************
 *                                                        PARSER                                                        *
 ************************************************************************************************************************/
export function useParser(json: string, socket: WebSocket) {
	const { username, message, hash, game, data } = Json({ message: json, target: Message.instance });
	if (message !== 'CONNECT' && hash !== mdb.getPlayerHash(username)) throw new Error('hash mismatch');
	console.log(username, message);
	switch (message) {
		case 'CONNECT': {
			const player: Player = mdb.createPlayer(username, socket);
			mdb.addPlayer(player);
			// TODO: Refactor Later
			break;
		}
		case 'REGISTER': {
			const register: Register = Json({ message: data, target: Register.instance });
			mdb.register(username, register.alias);
			// TODO: Refactor Later
			break;
		}
		case 'ENGAGE': {
			const engage: Engage = Json({ message: data, target: Engage.instance });
			mdb.connectPlayer(username, engage.gid, game);
			// TODO: Refactor Later
			break;
		}
		case 'INVITE': {
			const invite: Invite = Json({ message: data, target: Invite.instance });
			mdb.createInvitation(username, invite.recipient, game);
			// TODO: Refactor Later
			break;
		}
		case 'ACCEPT': {
			const invite: Invite = Json({ message: data, target: Invite.instance });
			mdb.acceptInvitation(invite.recipient, username);
			// TODO: Refactor Later
			break;
		}
		case 'REJECT': {
			const invite: Invite = Json({ message: data, target: Invite.instance });
			mdb.declineInvitation(invite.recipient, username);
			// TODO: Refactor Later
			break;
		}
		case 'DELETE': {
			const invite: Invite = Json({ message: data, target: Invite.instance });
			if (invite.recipient === '*') mdb.deleteAllRejectedInvitations(username);
			// TODO: Refactor Later
			else mdb.cancelInvitation(invite.recipient, username);
			break;
		}
		case 'HOOK': {
			const h: Hook = Json({ message: data, target: Hook.instance });
			mdb.roomHook(username, h);
			// TODO: Refactor Later
			break;
		}
		case 'FLIP': {
			const f: Flip = Json({ message: data, target: Flip.instance });
			mdb.roomFlip(username, f);
			// TODO: Refactor Later
			break;
		}
		// case 'TYNICHAT': {
		// 	const t: TinyChat = Json({ message: data, target: TinyChat.instance });
		// 	mdb.roomTinyChat(username, t);
		// 	// TODO: Refactor Later
		// 	break;
		// }
		default:
			throw new Error('UNKNOWN COMMAND');
	}
}

export function closeSocket(socket: WebSocket) {
	if (socket.username) {
		if (socket.PLAYFREE === false) {
			try {
				const room: Room = mdb.getRoom(socket.gid);
				room.roomState = 'disconnected';
				room.date_at = Date.now();
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} catch (err: any) {
				/* empty */
			}
		}
		mdb.cancelAllPlayerInvitations(socket.username);
		mdb.removePlayer(socket.username);
	}
}

export function eventEntry(message: string, socket: WebSocket) {
	try {
		useParser(message, socket);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		socket.send(ErrorMessage(error.message));
		console.error('\x1b[31mError processing message:', error.message);
	}
}

// * Main Loop
export function main() {
	setInterval(() => {
		mdb.deleteExpiredInvitations();
		mdb.updateTournament();
		mdb.updateRooms();
		mdb.sendPool();
		mdb.sendGame();
		mdb.sendInvitations();
		mdb.sendTournament();
	}, 1000 / 60);
}
