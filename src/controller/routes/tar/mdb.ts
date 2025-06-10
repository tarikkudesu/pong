import { randomUUID } from 'crypto';
import { WebSocket } from 'ws';

import { uniqueNamesGenerator, Config, adjectives, starWars } from 'unique-names-generator';

import {
	Flip,
	Hook,
	Pong,
	Doom,
	GameTYPE,
	timeLimite,
	ClientPong,
	DoomMessage,
	PlayMessage,
	PongMessage,
	PoolMessage,
	HashMessage,
	ClientPlayer,
	generateHash,
	RoomStateTYPE,
	transformFrame,
	ClientCardOfDoom,
	ClientInvitation,
	InvitationMessage,
	invitationTimeout,
	roomFinishTimeout,
	InvitationStateTYPE,
	roomConnectionTimeout,
	TournamentPlayerTYPE,
	TournamentMatchTYPE,
	TournamentStateTYPE,
} from './index.js';

export class Invitation {
	public game: GameTYPE;
	public sender: string;
	public recipient: string;
	public created_at: number;
	public invite_status: InvitationStateTYPE;
	constructor(sender: string, recipient: string, game: GameTYPE) {
		this.invite_status = 'pending';
		this.created_at = Date.now();
		this.recipient = recipient;
		this.sender = sender;
		this.game = game;
	}
}

export class Player {
	public username: string;
	public socket: WebSocket;
	public prevPool: string = '';
	public prevInvitations: string = '';
	constructor(username: string, socket: WebSocket) {
		this.username = username;
		this.socket = socket;
	}
}

export class Room {
	public player: string;
	public opponent: string;
	public date_at: number = Date.now();
	public game: Pong | Doom | null = null;
	public roomState: RoomStateTYPE = 'connecting';
	constructor(pu: string, ou: string) {
		this.opponent = ou;
		this.player = pu;
	}
}

export class Tournament {
	private _name: string = '';
	private _due_date: number = 0;
	private _maxPlayers: number = 5;
	private _currentLevel: number = 0;
	private _state: TournamentStateTYPE = 'not open';
	public matches: Set<TournamentMatchTYPE> = new Set();
	public registeredPlayers: Set<TournamentPlayerTYPE> = new Set();
	constructor() {}
	newTournament() {
		const customConfig: Config = {
			dictionaries: [adjectives, starWars],
			separator: '-',
			length: 2,
		};
		const date: Date = new Date();
		this.registeredPlayers.clear();
		this._name = uniqueNamesGenerator(customConfig);
		this._due_date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours() + 1).getTime();
		this._state = 'not open';
	}
	register(player: string) {
		if (Date.now() < this._due_date) throw new Error('Registration is not open yet my friend');
		if (this.registeredPlayers.size >= this._maxPlayers) throw new Error('Tournament is Full');
		this.registeredPlayers.add({ username: player, level: 0 });
		if (this.registeredPlayers.size === this._maxPlayers) this._state = 'playing';
	}
	levelup(player: string) {
		for (const p of this.registeredPlayers) if (p.username === player) p.level += 1;
		// TODO: TEST IF THE OBJECT IS MUTATED IN THE SET
	}
	update() {
		switch (this._state) {
			case 'not open': {
				if (Date.now() >= this._due_date) this._state = 'open';
				break;
			}
			case 'open': {
				break;
			}
			case 'playing': {
				break;
			}
			case 'finished': {
				this.newTournament();
				break;
			}
		}
	}
}

class Mdb {
	private invitations: Map<string, Invitation> = new Map();
	private players: Map<string, Player> = new Map();
	private rooms: Map<string, Room> = new Map();
	constructor() {}

	// * create player
	createPlayer(username: string, socket: WebSocket): Player {
		const player: Player = new Player(username, socket);
		const hash: string = generateHash(username);
		socket.username = username;
		socket.PLAYFREE = true;
		socket.hash = hash;
		socket.gid = '';
		return player;
	}

	/***************************************************************************************************************
	 *                                        TOURNAMENT TABLE MANIPULATION                                        *
	 ***************************************************************************************************************/

	/***************************************************************************************************************
	 *                                           ROOM TABLE MANIPULATION                                           *
	 ***************************************************************************************************************/

	// * new room
	addRoom(player: string, opponent: string, game: GameTYPE): void {
		const sen: Player = this.getPlayer(player);
		const rec: Player = this.getPlayer(opponent);
		const GID: string = randomUUID();
		sen.socket.send(PlayMessage(sen.username, sen.socket.hash, game, GID));
		rec.socket.send(PlayMessage(rec.username, rec.socket.hash, game, GID));
		this.rooms.set(GID, new Room(player, opponent));
	}

	// * remove room
	getRoom(gid: string): Room {
		const r: Room | undefined = this.rooms.get(gid);
		if (r === undefined) throw new Error("Room doesn't exists");
		return r;
	}

	// * remove room
	removeRoom(key: string) {
		this.rooms.delete(key);
	}

	// * connnect player to a room
	connectPlayer(username: string, gid: string, game: GameTYPE) {
		const room: Room = this.getRoom(gid);
		const player: Player = this.getPlayer(username);
		if (username !== room.player && username !== room.opponent) throw new Error('You are not allowed to be here');
		if (room.roomState === 'player-1-connected') room.roomState = 'player-2-connected';
		else if (room.roomState === 'connecting') room.roomState = 'player-1-connected';
		player.socket.PLAYFREE = false;
		player.socket.gid = gid;
		if (room.roomState === 'player-2-connected') {
			room.roomState = 'playing';
			if (game === 'pong') room.game = new Pong(room.player, room.opponent);
			else room.game = new Doom(room.player, room.opponent);
			room.date_at = Date.now();
		}
	}
	disconnectPlayer(player: Player) {
		player.socket.PLAYFREE = true;
		player.socket.gid = '';
	}
	// * room hook
	roomHook(username: string, hook: Hook): void {
		const r: Room = this.getRoom(hook.gid);
		if (r.game && r.game instanceof Pong) {
			if (r.player === username) r.game.keyPressLeft(hook.up, hook.down);
			if (r.opponent === username) r.game.keyPressRight(hook.up, hook.down);
		}
	}
	roomFlip(username: string, flip: Flip): void {
		const r: Room = this.getRoom(flip.gid);
		if (r.game && r.game instanceof Doom && (username === r.player || username === r.opponent)) r.game.flip(username, flip.pos);
	}

	// * update rooms
	updateRooms(): void {
		this.rooms.forEach((room, key) => {
			if (room.game && room.game.update()) {
				room.roomState = 'finished';
				room.date_at = Date.now();
				// TODO:    DATABASE    INTERACTION    HERE
				// TODO:    DATABASE    INTERACTION    HERE
				// TODO:    DATABASE    INTERACTION    HERE
				// TODO:    DATABASE    INTERACTION    HERE
			}
			if (room.roomState === 'connecting' && Date.now() - room.date_at > roomConnectionTimeout) this.removeRoom(key);
			else if (room.roomState === 'disconnected' && Date.now() - room.date_at > roomFinishTimeout) this.removeRoom(key);
			else if (room.roomState === 'finished' && Date.now() - room.date_at > roomFinishTimeout) this.removeRoom(key);
		});
	}

	/****************************************************************************************************************
	 *                                        PLAYERS TABLE MANIPULATION                                            *
	 ****************************************************************************************************************/

	// * add player
	addPlayer(player: Player): void {
		if (this.players.has(player.username)) throw new Error('Player already exists');
		this.players.set(player.username, player);
		player.socket.send(HashMessage(player.username, player.socket.hash, 'pong'));
	}
	// * remove player
	removePlayer(username: string) {
		this.players.delete(username);
	}
	// * get player Hash
	getPlayerHash(username: string): string {
		const player: Player | undefined = this.players.get(username);
		if (!player) throw new Error("Player-hash doesn't exists");
		return player.socket.hash;
	}
	// * get player
	getPlayer(username: string): Player {
		const player: Player | undefined = this.players.get(username);
		if (!player) throw new Error("Player-object doesn't exists");
		return player;
	}
	getPool(username: string): ClientPlayer[] {
		const pool: ClientPlayer[] = [];
		this.players.forEach((value) => {
			if (value.username !== username) {
				try {
					const i: Invitation = this.getInvitation(username, value.username);
					pool.push(new ClientPlayer(value.username, i.game, value.socket.PLAYFREE === true ? 'free' : 'playing', i.invite_status));
					// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
				} catch (err: any) {
					pool.push(new ClientPlayer(value.username, 'pong', value.socket.PLAYFREE === true ? 'free' : 'playing', 'unsent'));
				}
			}
		});
		return pool;
	}

	/****************************************************************************************************************
	 *                                      INVITATIONS TABLE MANIPULATION                                          *
	 ****************************************************************************************************************/
	// ? invite_status manipulation queries

	getInvitation(sender: string, recipient: string): Invitation {
		const invite: Invitation | undefined = this.invitations.get(sender + recipient);
		if (!invite) throw new Error(sender + recipient + ': no such invitation');
		return invite;
	}
	// * create invitation
	createInvitation(sender: string, recipient: string, game: GameTYPE): void {
		if (sender === recipient) throw new Error('invited yourself, pretty smart huh!!');
		const sen: Player = this.getPlayer(sender);
		const rec: Player = this.getPlayer(recipient);
		if (rec.socket.PLAYFREE === false) throw new Error(rec.username + ' is currently playing');
		if (this.invitations.has(sen.username + rec.username)) return;
		this.invitations.set(sen.username + rec.username, new Invitation(sen.username, rec.username, game));
	}
	// * update accepted invitation
	acceptInvitation(sender: string, recipient: string): void {
		const invite: Invitation = this.getInvitation(sender, recipient);
		if (invite.invite_status === 'pending') {
			invite.invite_status = 'accepted';
			this.cancelInvitation(sender, recipient);
			this.addRoom(sender, recipient, invite.game);
		}
	}
	// * update declined invitation
	declineInvitation(sender: string, recipient: string): void {
		const invite: Invitation = this.getInvitation(sender, recipient);
		if (invite.invite_status === 'pending') invite.invite_status = 'declined';
	}
	// * cancel invitation
	cancelInvitation(sender: string, recipient: string): void {
		this.invitations.delete(sender + recipient);
	}
	// * delete all expired invitation
	deleteExpiredInvitations() {
		this.invitations.forEach((value, key) => {
			if (Date.now() - value.created_at > invitationTimeout) this.invitations.delete(key);
		});
	}
	// * cancel all player invitations
	cancelAllPlayerInvitations(sender: string) {
		this.invitations.forEach((value, key) => {
			if (value.sender === sender) this.invitations.delete(key);
		});
	}
	// * delete all rejected invitation for a specific user
	deleteAllRejectedInvitations(sender: string): void {
		this.invitations.forEach((value, key) => {
			if (value.sender === sender && value.invite_status === 'declined') this.invitations.delete(key);
		});
	}
	// * get all player invitations
	getAllPlayerInvitations(username: string): ClientInvitation[] {
		const invitations: ClientInvitation[] = [];
		this.invitations.forEach((value) => {
			if (value.recipient === username) invitations.push(new ClientInvitation(value.sender, value.game, value.invite_status));
		});
		return invitations;
	}
	/************************************************************************************************************************
	 *                                                         MAIN                                                         *
	 ************************************************************************************************************************/

	sendGame() {
		this.players.forEach((player) => {
			try {
				if (player.socket.OPEN && player.socket.PLAYFREE === false) {
					const { roomState, game, opponent } = mdb.getRoom(player.socket.gid);
					if (game && game instanceof Pong) {
						const { ball, leftPaddle, rightPaddle, playerScore, opponentScore, winner } = game;
						let clientPong: ClientPong = new ClientPong({
							ball,
							leftPaddle,
							rightPaddle,
							playerScore,
							opponentScore,
							won: winner === player.username,
							stop: roomState === 'disconnected',
							lost: winner !== '' && winner !== player.username,
							start: roomState !== 'connecting' && roomState !== 'player-1-connected' && roomState !== 'player-2-connected',
						});
						if (player.username !== opponent) clientPong = transformFrame(clientPong);
						player.socket.send(PongMessage(player.username, player.socket.hash, 'pong', clientPong));
						if (clientPong.won || clientPong.lost || clientPong.stop) this.disconnectPlayer(player);
					} else if (game && game instanceof Doom) {
						const { winner, myturn, timer } = game;
						const clientDoom: ClientCardOfDoom = new ClientCardOfDoom({
							cards: game.getMap(),
							timer: Math.ceil((timeLimite - (Date.now() - timer)) / 1000),
							won: winner === player.username,
							myturn: myturn === player.username,
							stop: roomState === 'disconnected',
							lost: winner !== '' && winner !== player.username,
							start: roomState !== 'connecting' && roomState !== 'player-1-connected' && roomState !== 'player-2-connected',
						});
						player.socket.send(DoomMessage(player.username, player.socket.hash, 'doom', clientDoom));
						if (clientDoom.won || clientDoom.lost || clientDoom.stop) this.disconnectPlayer(player);
					}
				}
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
			} catch (err: any) {
				player.socket.PLAYFREE = true;
				player.socket.gid = '';
			}
		});
	}
	sendInvitations() {
		this.players.forEach((player) => {
			if (player.socket.OPEN && player.socket.PLAYFREE === true) {
				const m: string = InvitationMessage(player.username, player.socket.hash, 'pong', () => this.getAllPlayerInvitations(player.username));
				if (m !== player.prevInvitations) {
					player.prevInvitations = m;
					player.socket.send(m);
				}
			}
		});
	}
	sendPool() {
		this.players.forEach((player) => {
			if (player.socket.OPEN && player.socket.PLAYFREE === true) {
				const m: string = PoolMessage(player.username, player.socket.hash, 'pong', () => this.getPool(player.username));
				if (m !== player.prevPool) {
					player.socket.send(m);
					player.prevPool = m;
				}
			}
		});
	}
}

export const mdb = new Mdb();
