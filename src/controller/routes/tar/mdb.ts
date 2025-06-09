import crypto from 'crypto';
import { WebSocket } from 'ws';
import { randomUUID } from 'crypto';

import { Doom, timeLimite } from './CardOfDoom.js';
import { Pong } from './pong.js';
import {
	Flip,
	Hook,
	ClientPong,
	DoomMessage,
	PlayMessage,
	PongMessage,
	PoolMessage,
	ClientPlayer,
	transformFrame,
	ClientCardOfDoom,
	ClientInvitation,
	InvitationMessage,
} from './ws-server.js';

export const invitationTimeout: number = 10000;
export const roomFinishTimeout: number = 10000;
export const roomConnectionTimeout: number = 10000;

export function generateHash(text: string): string {
	return crypto.createHash('sha256').update(text).digest('hex');
}

export class Invitation {
	public sender: string;
	public recipient: string;
	public created_at: number;
	public game: 'pong' | 'card of doom';
	public invite_status: 'unsent' | 'pending' | 'accepted' | 'declined';
	constructor(sender: string, recipient: string, game: 'pong' | 'card of doom') {
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
	public playerNoBan: number = 1;
	public date_at: number = Date.now();
	public game: Pong | Doom | null = null;
	public roomState: 'connecting' | 'player-1-connected' | 'player-2-connected' | 'playing' | 'disconnected' | 'finished' = 'connecting';
	constructor(pu: string, ou: string) {
		this.opponent = ou;
		this.player = pu;
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
	 *                                           ROOM TABLE MANIPULATION                                           *
	 ***************************************************************************************************************/

	// * new room
	addRoom(pu: string, ou: string, gid: string): void {
		this.rooms.set(gid, new Room(pu, ou));
		console.log('ROOM CREATED');
	}

	// * remove room
	getRoom(gid: string): Room {
		const r: Room | undefined = this.rooms.get(gid);
		if (r === undefined) throw new Error("Room doesn't exists");
		return r;
	}

	// * remove room
	removeRoom(room: Room, key: string, r: string) {
		this.rooms.delete(key);
		console.log('ROOM REMOVED ', r);
	}

	// * connnect player to a room
	connectPlayer(username: string, gid: string, game: 'pong' | 'card of doom') {
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
			if (room.roomState === 'connecting' && Date.now() - room.date_at > roomConnectionTimeout)
				this.removeRoom(room, key, 'connecting');
			else if (room.roomState === 'disconnected' && Date.now() - room.date_at > roomFinishTimeout)
				this.removeRoom(room, key, 'disconnected');
			else if (room.roomState === 'finished' && Date.now() - room.date_at > roomFinishTimeout) this.removeRoom(room, key, 'finished');
		});
	}

	/****************************************************************************************************************
	 *                                        PLAYERS TABLE MANIPULATION                                            *
	 ****************************************************************************************************************/

	// * add player
	addPlayer(player: Player): void {
		if (this.checkIfPlayerExists(player.username)) throw new Error('Player already exists');
		this.players.set(player.username, player);
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
	// * check if Player exists
	checkIfPlayerExists(username: string): boolean {
		if (this.players.get(username)) return true;
		return false;
	}
	getPool(username: string): ClientPlayer[] {
		const pool: ClientPlayer[] = [];
		this.players.forEach((value) => {
			if (value.username !== username) {
				try {
					const i: Invitation = this.getInvitation(username, value.username);
					pool.push(
						new ClientPlayer(value.username, i.game, value.socket.PLAYFREE === true ? 'free' : 'playing', i.invite_status)
					);
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
	createInvitation(sender: string, recipient: string, game: 'pong' | 'card of doom'): void {
		if (sender === recipient) throw new Error('invited yourself, pretty smart huh!!');
		const sen: Player = this.getPlayer(sender);
		const rec: Player = this.getPlayer(recipient);
		if (rec.socket.PLAYFREE === false) throw new Error(rec.username + ' is currently playing');
		if (this.invitations.get(sen.username + rec.username)) return;
		this.invitations.set(sen.username + rec.username, new Invitation(sen.username, rec.username, game));
	}
	// * update accepted invitation
	acceptInvitation(sender: string, recipient: string): void {
		const invite: Invitation = this.getInvitation(sender, recipient);
		const sen: Player = this.getPlayer(sender);
		const rec: Player = this.getPlayer(recipient);
		if (invite.invite_status === 'pending') {
			const GID: string = randomUUID();
			invite.invite_status = 'accepted';
			this.addRoom(sen.username, rec.username, GID);
			sen.socket.send(PlayMessage(sen.username, sen.socket.hash, invite.game, GID));
			rec.socket.send(PlayMessage(rec.username, rec.socket.hash, invite.game, GID));
			this.cancelInvitation(sender, recipient);
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
						player.socket.send(DoomMessage(player.username, player.socket.hash, 'card of doom', clientDoom));
						if (clientDoom.won || clientDoom.lost || clientDoom.stop) this.disconnectPlayer(player);
					}
				}
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} catch (err: any) {
				player.socket.PLAYFREE = true;
				player.socket.gid = '';
			}
		});
	}
	sendInvitations() {
		this.players.forEach((player) => {
			if (player.socket.OPEN && player.socket.PLAYFREE === true) {
				const m: string = InvitationMessage(player.username, player.socket.hash, 'pong', () =>
					this.getAllPlayerInvitations(player.username)
				);
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
