import crypto from 'crypto';
import { WebSocket } from 'ws';
import { Pong } from './game/index.js';
import { Pooler, WS } from './ws-server.js';

export const invitationTimeout: number = 60;

export function generateHash(text: string): string {
	return crypto.createHash('sha256').update(text).digest('hex');
}

export class Invitation {
	public sender: string;
	public recipient: string;
	public img: string;
	public invite_status: 'pending' | 'accepted' | 'declined';
	public created_at: number;
	constructor(sender: string, recipient: string, img: string) {
		this.sender = sender;
		this.recipient = recipient;
		this.invite_status = 'pending';
		this.created_at = Date.now();
		this.img = img;
	}
}

export class Player {
	public username: string;
	public socket: WebSocket;
	public img: string;
	// constructor(username: string, img: string) {
	constructor(username: string, img: string, socket: WebSocket) {
		this.username = username;
		this.socket = socket;
		this.img = img;
	}
}

export class Room {
	public player: Player;
	public opponent: Player;
	public pong: Pong;
	public playerScore: number = 0;
	public opponentScore: number = 0;
	constructor(player: Player, opponent: Player) {
		this.pong = new Pong();
		this.player = player;
		this.opponent = opponent;
	}
}

class Mdb {
	private invitations: Map<string, Invitation> = new Map();
	private players: Map<string, Player> = new Map();
	private rooms: Map<string, Room> = new Map();

	constructor() {}
	/*****************************************************************************************************************
	 *                                           PLAYER ROOMS MANIPULATION                                           *
	 *****************************************************************************************************************/

	// * add room
	// TODO: CLIENT UPDATE
	addRoom(player: Player, opponent: Player): void {
		if (this.checkIfRoomExists(player.username, opponent.username)) throw new Error('room already exists');
		const room: Room = new Room(player, opponent);
		this.rooms.set(player.username + opponent.username, room);
	}
	// * remove room
	// TODO: CLIENT UPDATE
	removeRoom(player: string, opponent: string): void {
		if (!this.checkIfRoomExists(player, opponent)) throw new Error('room does not exist');
		this.rooms.delete(player + opponent);
	}

	// * check if room exists
	checkIfRoomExists(player: string, opponent: string): boolean {
		if (this.rooms.get(player + opponent)) return true;
		if (this.rooms.get(opponent + player)) return true;
		return false;
	}

	/****************************************************************************************************************
	 *                                        PLAYERS TABLE MANIPULATION                                            *
	 ****************************************************************************************************************/
	// * new player
	// TODO: CLIENT UPDATE
	addPlayer(username: string, img: string, socket: WebSocket) {
		if (this.checkIfPlayerExists(username)) throw new Error('Player already exists');
		const hash: string = generateHash(username);
		socket.username = username;
		socket.hash = hash;
		this.players.set(username, new Player(username, img, socket));
		return hash;
	}
	// * remove player
	// TODO: CLIENT UPDATE
	removePlayer(username: string) {
		this.players.delete(username);
	}

	// * check if Player exists
	checkIfPlayerExists(username: string): boolean {
		if (this.players.get(username)) return true;
		return false;
	}
	checkIfInvitationExists(sender: string, recipient: string): boolean {
		if (this.players.get(sender + recipient)) return true;
		return false;
	}
	// * get player id
	getPlayer(username: string): Player {
		const player: Player | undefined = this.players.get(username);
		if (!player) throw new Error("Player doesn't exists");
		return player;
	}
	// * select username + img player
	getAllPlayers() {
		console.warn('getAllPlayers() is not ideal. Use getAllOtherPlayersWithInviteStatus() instead.');
		return [...this.players.values()].map((ele) => ({
			username: ele.username,
			img: ele.img,
		}));
	}
	// * select username + img from all players but the user
	getAllOtherPlayers(username: string): Pooler[] {
		console.warn('getAllPlayers() is not ideal. Use getAllOtherPlayersWithInviteStatus() instead.');
		return [...this.players.values()]
			.map((ele) => {
				if (ele.username !== username)
					return {
						username: ele.username,
						img: ele.img,
					};
				return undefined;
			})
			.filter((player): player is { username: string; img: string } => Boolean(player));
	}
	getAllOtherPlayersWithInviteStatus(username: string) {
		const player: Player = this.getPlayer(username);
		return [...this.players.values()]
			.map((ele) => {
				if (ele.username !== username) {
					let invite_status: string = 'none';
					try {
						const invite = this.getInvitation(player, ele);
						invite_status = invite.invite_status;
					} catch (err) {}
					return {
						username: ele.username,
						img: ele.img,
						invite_status,
					};
				}
				return undefined;
			})
			.filter((player): player is { username: string; img: string; invite_status: string } => Boolean(player));
	}
	/****************************************************************************************************************
	 *                                      INVITATIONS TABLE MANIPULATION                                          *
	 ****************************************************************************************************************/
	// ? invite_status manipulation queries

	// * create invitation
	// TODO: CLIENT UPDATE
	createInvitation(sender: string, recipient: string): void {
		const sen: Player = this.getPlayer(sender);
		const rec: Player = this.getPlayer(recipient);
		if (sen.username === rec.username) throw new Error('invited yourself, pretty smart huh!!');
		if (this.invitations.get(sen.username + rec.username))
			throw new Error('stop trying to send invitation to this player, he already got one from you');
		this.invitations.set(sen.username + rec.username, new Invitation(sen.username, rec.username, rec.img));
	}
	// * update accepted invitation
	// TODO: CLIENT UPDATE
	acceptInvitation(sender: string, recipient: string): void {
		const sen: Player = this.getPlayer(sender);
		const rec: Player = this.getPlayer(recipient);
		if (sen.username === rec.username) throw new Error('you are trying to accept an invite to yourself, pretty smart huh!!');
		const invite: Invitation = this.getInvitation(sen, rec);
		if (invite.invite_status === 'pending') invite.invite_status = 'accepted';
	}
	// * update declined invitation
	// TODO: CLIENT UPDATE
	declineInvitation(sender: string, recipient: string): void {
		const sen: Player = this.getPlayer(sender);
		const rec: Player = this.getPlayer(recipient);
		if (sen.username === rec.username) throw new Error('you are trying to accept an invite to yourself, pretty smart huh!!');
		const invite: Invitation = this.getInvitation(sen, rec);
		if (invite.invite_status === 'pending') invite.invite_status = 'declined';
	}
	// * delete all expired invitation
	// TODO: CLIENT UPDATE
	deleteExpiredInvitations() {
		console.log([...this.invitations.values()]);
		[...this.invitations.values()].forEach((ele) => {
			if (Date.now() - ele.created_at > invitationTimeout) this.invitations.delete(ele.sender + ele.recipient);
		});
		console.log([...this.invitations.values()]);
	}
	// * cancel invitation
	// TODO: CLIENT UPDATE
	cancelInvitation(sender: string, recipient: string): void {
		const sen: Player = this.getPlayer(sender);
		const rec: Player = this.getPlayer(recipient);
		this.invitations.delete(sen.username + rec.username);
	}
	// * cancel all player invitations
	// TODO: CLIENT UPDATE
	cancelAllPlayerInvitations(sender: string) {
		this.getAllPlayerInvitations(sender).forEach((invite) => {
			this.invitations.delete(sender + invite?.recipient);
		});
	}
	// * delete a rejected invitation for a specific user
	// TODO: CLIENT UPDATE
	deleteRejectedInvitation(sender: string, recipient: string) {
		this.cancelInvitation(sender, recipient);
	}
	// * delete all rejected invitation for a specific user
	// TODO: CLIENT UPDATE
	deleteAllRejectedInvitations(sender: string): void {
		[...this.invitations.values()].forEach((invite) => {
			if (invite.sender === sender && invite.invite_status === 'declined') {
				this.invitations.delete(invite.sender + invite.recipient);
			}
		});
	}
	// ! NOT IDEAL
	deleteAllInvitations(): void {
		console.warn("Deleting all invitations, this isn' a nice thing to do my friend, are you depressed or what");
		this.invitations.clear();
	}
	getAllInvitations() {
		return [...this.invitations.values()].map((ele) => ({
			sender: ele.sender,
			recipient: ele.recipient,
			invite_status: ele.invite_status,
			img: ele.img,
		}));
	}
	getAllPlayerInvitations(username: string) {
		if (!this.checkIfPlayerExists(username)) throw new Error("player doesn't exist");
		return [...this.invitations.values()]
			.map((ele) => {
				if (ele.sender === username)
					return {
						sender: ele.sender,
						recipient: ele.recipient,
						invite_status: ele.invite_status,
						img: ele.img,
					};
				return undefined;
			})
			.filter(Boolean);
	}
	getInvitation(sender: Player, recipient: Player): Invitation {
		const invite: Invitation | undefined = this.invitations.get(sender.username + recipient.username);
		if (!invite) throw new Error(sender.username + ', ' + recipient.username + ': no such invitation');
		return invite;
	}
	// TODO: everyupdate to the database should be followed by a client update

	/************************************************************************************************************************
	 *                                                         MAIN                                                         *
	 ************************************************************************************************************************/
	main() {
		this.deleteExpiredInvitations();
		// TODO: Loop over all players and send their data
		[...this.players.values()].forEach((ele) => {
			if (ele.socket.readyState === WebSocket.OPEN) {
				ele.socket.send(WS.PoolMessage(() => this.getAllOtherPlayers(ele.username)));
			}
		});
	}
}

export const mdb = new Mdb();

export function main() {}
