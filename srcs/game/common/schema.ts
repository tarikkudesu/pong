import * as Main from '../index.js';

interface MessageProps {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: any;
	hash: string;
	game: Main.GameTYPE;
	message: string;
	username: string;
}

export class Message {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public data: any;
	public hash: string;
	public game: Main.GameTYPE;
	public message: string;
	public username: string;
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
	public game: Main.GameTYPE;
	public playerStatus: Main.PlayerStateTYPE;
	public inviteStatus: Main.InvitationStateTYPE;
	constructor(username: string, game: Main.GameTYPE, playerStatus: Main.PlayerStateTYPE, inviteStatus: Main.InvitationStateTYPE) {
		this.inviteStatus = inviteStatus;
		this.playerStatus = playerStatus;
		this.username = username;
		this.game = game;
	}
	static instance = new ClientPlayer('', 'pong', 'free', 'unsent');
}

export class ClientInvitation {
	public sender: string;
	public game: Main.GameTYPE;
	public inviteStatus: Main.InvitationStateTYPE;
	constructor(sender: string, game: Main.GameTYPE, inviteStatus: Main.InvitationStateTYPE) {
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
	state: Main.TournamentStateTYPE;
	results: Main.TournamentPlayerTYPE[];
	nextMatches: Main.ClientTournamentMatchTYPE[];
}

export class ClientTournament {
	public gid: string;
	public date: string;
	public name: string;
	public round: number;
	public emptySlots: number;
	public registered: boolean;
	public state: Main.TournamentStateTYPE;
	public results: Main.TournamentPlayerTYPE[];
	public nextMatches: Main.ClientTournamentMatchTYPE[];
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
	rightPaddle: Main.Paddle;
	leftPaddle: Main.Paddle;
	tinychat: string;
	ball: Main.Ball;
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
		this.ballRadius = Math.ceil(Main.BallRadius);
		this.paddleRadius = Math.ceil(Main.PaddleRadius);
		this.rightPaddlePosX = Math.ceil(rightPaddle.pos.x);
		this.rightPaddlePosY = Math.ceil(rightPaddle.pos.y);
		this.leftPaddlePosX = Math.ceil(leftPaddle.pos.x);
		this.leftPaddlePosY = Math.ceil(leftPaddle.pos.y);
		this.paddleHeight = Math.ceil(2 * Main.PaddleHeight);
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
