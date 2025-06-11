import { randomUUID } from 'crypto';
import { WebSocket } from 'ws';

import { uniqueNamesGenerator, Config, adjectives, starWars } from 'unique-names-generator';
import { format } from 'date-fns';

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
	TournamentMessage,
	ClientTournament,
	ClientTournamentMatchTYPE,
} from './index.js';
import _ from 'lodash';

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
	public prevTournament: string = '';
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
	public name: string = '';
	public due_date: number = 0;
	public maxPlayers: number = 5;
	public currentLevel: number = 0;
	public state: TournamentStateTYPE = 'finished';
	public matches: Set<TournamentMatchTYPE> = new Set();
	public registeredPlayers: Set<TournamentPlayerTYPE> = new Set();
	constructor() {
		this.newTournament();
	}
	newTournament() {
		const customConfig: Config = {
			dictionaries: [adjectives, starWars],
			separator: '-',
			length: 2,
		};
		const date: Date = new Date();
		this.matches.clear();
		this.currentLevel = 0;
		this.state = 'not open';
		this.registeredPlayers.clear();
		this.name = uniqueNamesGenerator(customConfig);
		this.due_date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes() + 1).getTime();
	}
	register(player: string) {
		if (Date.now() < this.due_date) throw new Error('Registration is not open yet my friend');
		if (this.registeredPlayers.size >= this.maxPlayers) throw new Error('Tournament is Full');
		if (![...this.registeredPlayers].some((e) => e.username === player)) this.registeredPlayers.add({ username: player, level: 0 });
		if (this.registeredPlayers.size === this.maxPlayers) this.state = 'playing';
	}
	levelup(player: string) {
		for (const p of this.registeredPlayers) if (p.username === player) p.level += 1;
	}
	registerRoomResult(room: Room, key: string) {
		this.matches.forEach((match) => {
			if (match.GID === key) {
				if (room.game) {
					if (room.game.winner === match.player) this.levelup(match.player);
					else this.levelup(match.opponent);
				}
				this.matches.delete(match);
				return;
			}
		});
	}
}

class Mdb {
	private invitations: Map<string, Invitation> = new Map();
	private players: Map<string, Player> = new Map();
	private rooms: Map<string, Room> = new Map();
	private tournament = new Tournament();
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

	updateTournament() {
		switch (this.tournament.state) {
			case 'not open': {
				if (Date.now() >= this.tournament.due_date) this.tournament.state = 'open';
				break;
			}
			case 'open': {
				break;
			}
			case 'playing': {
				[...this.tournament.matches].forEach((ele) => {
					if (ele.finished) this.tournament.matches.delete(ele);
				});
				if (this.tournament.matches.size === 0) {
					// TODO: Next Matches
					const winners: TournamentPlayerTYPE[] = [...this.tournament.registeredPlayers].filter((e) => e.level === this.tournament.currentLevel).sort();
					if (winners.length === 1 || winners.length === 0) this.tournament.state = 'finished';
					else {
						this.tournament.matches.clear();
						for (let i = 0; i < winners.length; i++) {
							if (i + 1 < winners.length) {
								this.createTournamentMatch(winners[i].username, winners[i + 1].username);
								i++;
							} else {
								this.tournament.levelup(winners[i].username);
							}
						}
						this.tournament.currentLevel += 1;
					}
				}
				break;
			}
			case 'finished': {
				this.tournament.newTournament();
				break;
			}
		}
	}

	createTournamentMatch(player: string, opponent: string) {
		const GID: string = randomUUID();
		this.tournament.matches.add({ player, opponent, finished: false, GID });
		this.rooms.set(GID, new Room(player, opponent));
		// this.addRoom(player, opponent, 'pong', GID);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	register(username: string, name: string) {
		this.tournament.register(username);
	}

	/***************************************************************************************************************
	 *                                           ROOM TABLE MANIPULATION                                           *
	 ***************************************************************************************************************/

	// * new room
	addRoom(player: string, opponent: string, game: GameTYPE, GID: string): void {
		const sen: Player = this.getPlayer(player);
		const rec: Player = this.getPlayer(opponent);
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
	removeRoom(room: Room, key: string) {
		this.tournament.registerRoomResult(room, key);
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
				this.tournament.registerRoomResult(room, key);
				// TODO:    DATABASE    INTERACTION    HERE
				// TODO:    DATABASE    INTERACTION    HERE
				// TODO:    DATABASE    INTERACTION    HERE
				// TODO:    DATABASE    INTERACTION    HERE
			}
			if (room.roomState === 'connecting' && Date.now() - room.date_at > roomConnectionTimeout) this.removeRoom(room, key);
			else if (room.roomState === 'disconnected' && Date.now() - room.date_at > roomFinishTimeout) this.removeRoom(room, key);
			else if (room.roomState === 'finished' && Date.now() - room.date_at > roomFinishTimeout) this.removeRoom(room, key);
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
			this.addRoom(sender, recipient, invite.game, randomUUID());
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
	sendTournament() {
		this.players.forEach((player) => {
			if (player.socket.OPEN && player.socket.PLAYFREE === true) {
				const { name, due_date, registeredPlayers, maxPlayers, matches, state, currentLevel } = this.tournament;
				const clientMatches: Set<ClientTournamentMatchTYPE> = new Set();
				let gid: string = '';
				matches.forEach((e: TournamentMatchTYPE) => {
					if (e.player === player.username || e.opponent === player.username) gid = e.GID;
					clientMatches.add({ player: e.player, opponent: e.opponent, finished: e.finished });
				});
				const m: string = TournamentMessage(
					player.username,
					player.socket.hash,
					'pong',
					new ClientTournament({
						gid,
						name,
						state,
						round: currentLevel,
						results: [...registeredPlayers],
						nextMatches: [...clientMatches],
						date: format(due_date, 'yyyy-MM-dd HH:mm'),
						emptySlots: maxPlayers - registeredPlayers.size,
						registered: [...registeredPlayers].some((e) => e.username === player.username),
					})
				);
				if (m !== player.prevTournament) {
					player.prevTournament = m;
					player.socket.send(m);
				}
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
