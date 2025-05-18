import crypto from 'crypto';
import { WebSocket } from 'ws';

export const invitationTimeout: number = 60;

export function generateHash(text: string): string {
	return crypto.createHash('sha256').update(text).digest('hex');
}

declare module 'ws' {
	interface WebSocket {
		username?: string;
	}
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
	public img: string;
	public socket: WebSocket;
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
	constructor(player: Player, opponent: Player) {
		this.player = player;
		this.opponent = opponent;
	}
}

class Mdb {
	private invitations: Map<string, Invitation> = new Map();
	private playersOnline: Map<string, Player> = new Map();
	private rooms: Map<string, Room> = new Map();

	constructor() {}
	/****************************************************************************************************************
	 *                                        PLAYERS TABLE MANIPULATION                                            *
	 ****************************************************************************************************************/
	// * check if Player exists
	checkIfPlayerExists(username: string): boolean {
		if (this.playersOnline.get(username)) return true;
		return false;
	}
	checkIfInvitationExists(sender: string, recipient: string): boolean {
		if (this.playersOnline.get(sender + recipient)) return true;
		return false;
	}
	// * new player
	addPlayer(username: string, img: string, socket?: WebSocket) {
		if (this.checkIfPlayerExists(username)) throw new Error('Player already exists');
		const hash: string = generateHash(username);
		this.playersOnline.set(username, new Player(username, img));
		return hash;
	}
	// * remove player
	removePlayer(username: string) {
		this.playersOnline.delete(username);
	}
	// * get player id
	getPlayer(username: string): Player {
		const player: Player | undefined = this.playersOnline.get(username);
		if (!player) throw new Error("Player doesn't exists");
		return player;
	}
	// * select username + img player
	getAllPlayers() {
		console.warn('getAllPlayers() is not ideal. Use getAllOtherPlayersWithInviteStatus() instead.');
		return [...this.playersOnline.values()].map((ele) => ({
			username: ele.username,
			img: ele.img,
		}));
	}
	// * select username + img from all players but the user
	getAllOtherPlayers(username: string) {
		console.warn('getAllPlayers() is not ideal. Use getAllOtherPlayersWithInviteStatus() instead.');
		return [...this.playersOnline.values()]
			.map((ele) => {
				if (ele.username !== username)
					return {
						username: ele.username,
						img: ele.img,
					};
				return undefined;
			})
			.filter(Boolean);
	}
	// TODO: Add invitations status
	getAllOtherPlayersWithInviteStatus(username: string) {
		const player: Player = this.getPlayer(username);
		return [...this.playersOnline.values()]
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
			.filter(Boolean);
	}
	/****************************************************************************************************************
	 *                                      INVITATIONS TABLE MANIPULATION                                          *
	 ****************************************************************************************************************/
	// ? invite_status manipulation queries
	// * create invitation
	createInvitation(sender: string, recipient: string): void {
		const sen: Player = this.getPlayer(sender);
		const rec: Player = this.getPlayer(recipient);
		if (sen.username === rec.username) throw new Error('invited yourself, pretty smart huh!!');
		if (this.invitations.get(sen.username + rec.username))
			throw new Error('stop trying to send invitation to this player, he already got one from you');
		this.invitations.set(sen.username + rec.username, new Invitation(sen.username, rec.username, rec.img));
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
	// * delete all expired invitation
	deleteExpiredInvitations() {
		console.log([...this.invitations.values()]);
		[...this.invitations.values()].forEach((ele) => {
			if (Date.now() - ele.created_at > invitationTimeout) this.invitations.delete(ele.sender + ele.recipient);
		});
		console.log([...this.invitations.values()]);
	}
	// * cancel invitation
	cancelInvitation(sender: string, recipient: string): void {
		const sen: Player = this.getPlayer(sender);
		const rec: Player = this.getPlayer(recipient);
		this.invitations.delete(sen.username + rec.username);
	}
	// * cancel all player invitations
	cancelAllPlayerInvitations(sender: string) {
		this.getAllPlayerInvitations(sender).forEach((invite) => {
			this.invitations.delete(sender + invite?.recipient);
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
	deleteAllInvitations(): void {
		console.warn("Deleting all invitations, this isn' a nice thing to do my friend, are you depressed or what");
		this.invitations.clear();
	}
}

export const mdb = new Mdb();
