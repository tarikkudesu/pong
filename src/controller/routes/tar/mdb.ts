import crypto from 'crypto';
import { WebSocket } from 'ws';
import { Pong } from './game/index.js';
import { ClientInvitation, ClientPlayer, WS } from './ws-server.js';

export const invitationTimeout: number = 30000;

export function generateHash(text: string): string {
	return crypto.createHash('sha256').update(text).digest('hex');
}

export class Invitation {
	public img: string;
	public sender: string;
	public recipient: string;
	public created_at: number;
	public invite_status: 'unsent' | 'pending' | 'accepted' | 'declined';
	constructor(sender: string, recipient: string, img: string) {
		this.invite_status = 'pending';
		this.created_at = Date.now();
		this.recipient = recipient;
		this.sender = sender;
		this.img = img;
	}
}

export class Player {
	public img: string;
	public username: string;
	public socket: WebSocket;
	constructor(username: string, img: string, socket: WebSocket) {
		this.username = username;
		this.socket = socket;
		this.img = img;
	}
}

export class Room {
	public pong: Pong;
	public player: Player;
	public opponent: Player;
	public playerScore: number = 0;
	public opponentScore: number = 0;
	constructor(player: Player, opponent: Player) {
		this.opponent = opponent;
		this.pong = new Pong();
		this.player = player;
	}
}

class Mdb {
	private invitations: Map<string, Invitation> = new Map();
	private players: Map<string, Player> = new Map();
	private rooms: Map<string, Room> = new Map();
	constructor() {}
	/****************************************************************************************************************
	 *                                        PLAYERS TABLE MANIPULATION                                            *
	 ****************************************************************************************************************/
	// * new player
	addPlayer(username: string, img: string, socket: WebSocket) {
		if (this.checkIfPlayerExists(username)) throw new Error('Player already exists');
		const hash: string = generateHash(username);
		socket.username = username;
		socket.hash = hash;
		this.players.set(username, new Player(username, img, socket));
		return hash;
	}
	// * remove player
	removePlayer(username: string) {
		this.players.delete(username);
	}
	// * get player
	getPlayer(username: string): Player {
		const player: Player | undefined = this.players.get(username);
		if (!player) throw new Error("Player doesn't exists");
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
			if (value.username !== username) {
				try {
					pool.push(new ClientPlayer(value.username, value.img, this.getInvitation(player, value).invite_status));
				} catch (err: any) {
					pool.push(new ClientPlayer(value.username, value.img, 'unsent'));
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
	createInvitation(sender: string, recipient: string): void {
		const sen: Player = this.getPlayer(sender);
		const rec: Player = this.getPlayer(recipient);
		if (sen.username === rec.username) throw new Error('invited yourself, pretty smart huh!!');
		if (this.invitations.get(sen.username + rec.username))
			throw new Error('stop trying to send invitation to this player, he already got one from you');
		this.invitations.set(sen.username + rec.username, new Invitation(sen.username, rec.username, sen.img));
	}
	// * update accepted invitation
	acceptInvitation(sender: string, recipient: string): void {
		const sen: Player = this.getPlayer(sender);
		const rec: Player = this.getPlayer(recipient);
		if (sen.username === rec.username) throw new Error('you are trying to accept an invite to yourself, pretty smart huh!!');
		const invite: Invitation = this.getInvitation(sen, rec);
		if (invite.invite_status === 'pending') invite.invite_status = 'accepted';
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
	}
	// * delete all expired invitation
	deleteExpiredInvitations() {
		[...this.invitations.values()].forEach((ele) => {
			if (Date.now() - ele.created_at > invitationTimeout) {
				this.invitations.delete(ele.sender + ele.recipient);
			}
		});
	}
	// * cancel all player invitations
	cancelAllPlayerInvitations(sender: string) {
		if (!this.checkIfPlayerExists(sender)) throw new Error("player doesn't exist");
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
		[...this.invitations.values()].forEach((invite) => {
			if (invite.sender === sender && invite.invite_status === 'declined') {
				this.invitations.delete(invite.sender + invite.recipient);
			}
		});
	}
	getAllPlayerInvitations(username: string): ClientInvitation[] {
		if (!this.checkIfPlayerExists(username)) throw new Error("player doesn't exist");
		const invitations: ClientInvitation[] = [];
		this.invitations.forEach((value) => {
			if (value.recipient === username) invitations.push(new ClientInvitation(value.sender, value.img, value.invite_status));
		});
		return invitations;
	}
	/************************************************************************************************************************
	 *                                                         MAIN                                                         *
	 ************************************************************************************************************************/

	updateMdb() {
		this.deleteExpiredInvitations();
	}
	updateClient() {
		this.players.forEach((value) => {
			if (value.socket.readyState === WebSocket.OPEN) {
				value.socket.send(WS.PoolMessage(() => this.getPool(value.username)));
				value.socket.send(WS.InvitationMessage(() => this.getAllPlayerInvitations(value.username)));
			}
		});
	}
}

export const mdb = new Mdb();
