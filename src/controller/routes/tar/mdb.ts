import crypto from 'crypto';
import { WebSocket } from 'ws';
import { randomUUID } from 'crypto';
import { BallState, Pong, PongHeight, PongWidth, randInt } from './pong.js';
import { ClientCardOfDoom, ClientInvitation, ClientPlayer, ClientPong, Flip, Hook, Play, transformFrame, WS } from './ws-server.js';
import { Doom } from './CardOfDoom.js';

export const invitationTimeout: number = 30000;
export const roomConnectionTimeout: number = 300000;
export const roomFinishTimeout: number = 5000;

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
	constructor(username: string, socket: WebSocket) {
		this.username = username;
		this.socket = socket;
	}
}

export class Room {
	public player: string;
	public opponent: string;
	public finished_at: number = 0;
	public playerNoBan: number = 1;
	public created_at: number = Date.now();
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
		return player;
	}

	/***************************************************************************************************************
	 *                                           ROOM TABLE MANIPULATION                                           *
	 ***************************************************************************************************************/

	// * new room
	addRoom(pu: string, ou: string, gid: string): void {
		this.rooms.set(gid, new Room(pu, ou));
	}

	// * remove room
	getRoom(gid: string): Room {
		let r: Room | undefined = this.rooms.get(gid);
		if (r === undefined) throw new Error("Room doesn't exists");
		return r;
	}

	// * connnect player to a room
	connectPlayer(player: string, gid: string, game: 'pong' | 'card of doom') {
		const r: Room = this.getRoom(gid);
		const p: Player = this.getPlayer(player);
		p.socket.PLAYFREE = false;
		if (player !== r.player && player !== r.opponent) throw new Error('You are not allowed to be here');
		if (player === r.player && r.roomState === 'connecting') r.roomState = 'player-1-connected';
		else if (player === r.player && r.roomState === 'player-1-connected') r.roomState = 'player-2-connected';
		if (player === r.opponent && r.roomState === 'connecting') r.roomState = 'player-1-connected';
		else if (player === r.opponent && r.roomState === 'player-1-connected') r.roomState = 'player-2-connected';
		if (r.roomState === 'player-2-connected') {
			r.roomState = 'playing';
			if (game === 'pong') r.game = new Pong(r.player, r.opponent);
			else r.game = new Doom(r.player, r.opponent);
		}
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
		else throw new Error('Not allowed');
	}

	// * update rooms
	updateRooms(): void {
		this.rooms.forEach((room, key) => {
			if (room.game) room.game.update();
			let player: Player | null = null;
			let opponent: Player | null = null;
			try {
				player = this.getPlayer(room.player);
				if (!player.socket.OPEN) {
					player = null;
					throw new Error('Player disconnected');
				}
			} catch (err) {
				room.roomState = 'disconnected';
			}
			try {
				opponent = this.getPlayer(room.opponent);
				if (!opponent.socket.OPEN) {
					opponent = null;
					throw new Error('Opponent disconnected');
				}
			} catch (err) {
				room.roomState = 'disconnected';
			}
			try {
				if (player !== null && room.game && room.game instanceof Pong) {
					const { ball, leftPaddle, rightPaddle, playerScore, opponentScore, winner } = room.game;
					player.socket.send(
						WS.PongMessage(
							player.username,
							player.socket.hash,
							'pong',
							transformFrame(
								new ClientPong({
									playerScore,
									opponentScore,
									ball,
									leftPaddle,
									rightPaddle,
									won: winner === 'player',
									lost: winner === 'opponent',
									start:
										room.roomState !== 'connecting' &&
										room.roomState !== 'player-1-connected' &&
										room.roomState !== 'player-2-connected',
									stop: room.roomState === 'disconnected',
								})
							)
						)
					);
				}
				if (opponent !== null && room.game && room.game instanceof Pong) {
					const { ball, leftPaddle, rightPaddle, playerScore, opponentScore, winner } = room.game;
					opponent.socket.send(
						WS.PongMessage(
							opponent.username,
							opponent.socket.hash,
							'pong',
							new ClientPong({
								playerScore,
								opponentScore,
								ball,
								leftPaddle,
								rightPaddle,
								won: winner === 'opponent',
								lost: winner === 'player',
								start:
									room.roomState !== 'connecting' &&
									room.roomState !== 'player-1-connected' &&
									room.roomState !== 'player-2-connected',
								stop: room.roomState === 'disconnected',
							})
						)
					);
				}
				if (player !== null && room.game && room.game instanceof Doom) {
					const { winner, myturn, timer } = room.game;
					player.socket.send(
						WS.DoomMessage(
							player.username,
							player.socket.hash,
							'card of doom',
							new ClientCardOfDoom({
								timer: 2,
								won: winner === 'player',
								lost: winner === 'opponent',
								cards: room.game.getMap(),
								myturn: myturn === player.username,
								start:
									room.roomState !== 'connecting' &&
									room.roomState !== 'player-1-connected' &&
									room.roomState !== 'player-2-connected',
								stop: room.roomState === 'disconnected',
							})
						)
					);
				}
				if (opponent !== null && room.game && room.game instanceof Doom) {
					const { winner, myturn, timer } = room.game;
					opponent.socket.send(
						WS.DoomMessage(
							opponent.username,
							opponent.socket.hash,
							'card of doom',
							new ClientCardOfDoom({
								timer: Date.now() - timer,
								cards: room.game.getMap(),
								won: winner === 'opponent',
								lost: winner === 'player',
								myturn: myturn === opponent.username,
								start:
									room.roomState !== 'connecting' &&
									room.roomState !== 'player-1-connected' &&
									room.roomState !== 'player-2-connected',
								stop: room.roomState === 'disconnected',
							})
						)
					);
				}
			} catch (err: any) {
				room.roomState = 'disconnected';
			}
			if (room.roomState === 'connecting' && Date.now() - room.created_at > roomConnectionTimeout) this.rooms.delete(key);
			if (room.roomState === 'finished' && Date.now() - room.finished_at > roomFinishTimeout) this.rooms.delete(key);
			else if (room.roomState === 'disconnected') this.rooms.delete(key);
		});
	}

	/****************************************************************************************************************
	 *                                        PLAYERS TABLE MANIPULATION                                            *
	 ****************************************************************************************************************/

	// * add player
	addPlayer(player: Player): void {
		if (this.checkIfPlayerExists(player.username)) throw new Error('Player already exists');
		this.players.set(player.username, player);
		console.log([...this.players.keys()]);
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
		const player: Player = this.getPlayer(username);
		const pool: ClientPlayer[] = [];
		this.players.forEach((value, key) => {
			if (value.username !== username && value.socket.PLAYFREE === true) {
				try {
					const i: Invitation = this.getInvitation(player, value);
					pool.push(new ClientPlayer(value.username, i.game, i.invite_status));
				} catch (err: any) {
					pool.push(new ClientPlayer(value.username, 'pong', 'unsent'));
				}
			}
		});
		return pool;
	}
	/****************************************************************************************************************
	 *                                      INVITATIONS TABLE MANIPULATION                                          *
	 ****************************************************************************************************************/
	// ? invite_status manipulation queries

	getInvitation(sender: Player, recipient: Player): Invitation {
		const invite: Invitation | undefined = this.invitations.get(sender.username + recipient.username);
		if (!invite) throw new Error(sender.username + ', ' + recipient.username + ': no such invitation');
		return invite;
	}
	// * create invitation
	createInvitation(sender: string, recipient: string, game: 'pong' | 'card of doom'): void {
		const sen: Player = this.getPlayer(sender);
		const rec: Player = this.getPlayer(recipient);
		if (sen.username === rec.username) throw new Error('invited yourself, pretty smart huh!!');
		if (this.invitations.get(sen.username + rec.username))
			throw new Error('stop trying to send invitation to this player, he already got one from you');
		this.invitations.set(sen.username + rec.username, new Invitation(sen.username, rec.username, game));
	}
	// * update accepted invitation
	acceptInvitation(sender: string, recipient: string): void {
		const sen: Player = this.getPlayer(sender);
		const rec: Player = this.getPlayer(recipient);
		if (sen.username === rec.username) throw new Error('you are trying to accept an invite to yourself, pretty smart huh!!');
		const invite: Invitation = this.getInvitation(sen, rec);
		if (invite.invite_status === 'pending') {
			const GID: string = randomUUID();
			invite.invite_status = 'accepted';
			this.addRoom(sen.username, rec.username, GID);
			sen.socket.send(WS.PlayMessage(sen.username, sen.socket.hash, invite.game, GID));
			rec.socket.send(WS.PlayMessage(rec.username, rec.socket.hash, invite.game, GID));
		}
	}
	// * update declined invitation
	declineInvitation(sender: string, recipient: string): void {
		const sen: Player = this.getPlayer(sender);
		const rec: Player = this.getPlayer(recipient);
		if (sen.username === rec.username) throw new Error('you are trying to accept an invite to yourself, pretty smart huh!!');
		const invite: Invitation = this.getInvitation(sen, rec);
		if (invite.invite_status === 'pending') invite.invite_status = 'declined';
	}
	// * cancel invitation
	cancelInvitation(sender: string, recipient: string): void {
		const sen: Player = this.getPlayer(sender);
		const rec: Player = this.getPlayer(recipient);
		this.invitations.delete(sen.username + rec.username);
		console.log(sen.username, rec.username, this.invitations);
	}
	// * delete all expired invitation
	deleteExpiredInvitations() {
		this.invitations.forEach((value, key) => {
			if (Date.now() - value.created_at > invitationTimeout) this.invitations.delete(key);
		});
	}
	// * cancel all player invitations
	cancelAllPlayerInvitations(sender: string) {
		const invitations: Invitation[] = [];
		this.invitations.forEach((value) => {
			if (value.sender === sender) invitations.push(value);
		});
		invitations.forEach((value) => {
			this.invitations.delete(sender + value.recipient);
		});
	}
	// * delete a rejected invitation for a specific user
	deleteRejectedInvitation(sender: string, recipient: string) {
		this.cancelInvitation(sender, recipient);
	}
	// * delete all rejected invitation for a specific user
	deleteAllRejectedInvitations(sender: string): void {
		this.invitations.forEach((value, key) => {
			if (value.sender === sender && value.invite_status === 'declined') this.invitations.delete(value.sender + value.recipient);
		});
	}
	// * get all player invitations
	getAllPlayerInvitations(username: string): ClientInvitation[] {
		if (!this.checkIfPlayerExists(username)) throw new Error("get all player invitations: player doesn't exist");
		const invitations: ClientInvitation[] = [];
		this.invitations.forEach((value) => {
			if (value.recipient === username) invitations.push(new ClientInvitation(value.sender, value.game, value.invite_status));
		});
		return invitations;
	}
	/************************************************************************************************************************
	 *                                                         MAIN                                                         *
	 ************************************************************************************************************************/

	sendInvitations() {
		this.players.forEach((value) => {
			if (value.socket.readyState === WebSocket.OPEN && value.socket.PLAYFREE === true) {
				value.socket.send(
					WS.InvitationMessage(value.username, value.socket.hash, 'pong', () => this.getAllPlayerInvitations(value.username))
				);
			}
		});
	}
	sendPool() {
		this.players.forEach((value) => {
			if (value.socket.readyState === WebSocket.OPEN && value.socket.PLAYFREE === true) {
				value.socket.send(WS.PoolMessage(value.username, value.socket.hash, 'pong', () => this.getPool(value.username)));
			}
		});
	}
}

export const mdb = new Mdb();
