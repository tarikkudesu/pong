import { randomUUID } from 'crypto';
import * as Main from '../index.js';

export class Invitation {
	public game: Main.GameTYPE;
	public sender: string;
	public recipient: string;
	public created_at: number;
	public invite_status: Main.InvitationStateTYPE;
	constructor(sender: string, recipient: string, game: Main.GameTYPE) {
		this.invite_status = 'pending';
		this.created_at = Date.now();
		this.recipient = recipient;
		this.sender = sender;
		this.game = game;
	}
}

/****************************************************************************************************************
 *                                      INVITATIONS TABLE MANIPULATION                                          *
 ****************************************************************************************************************/

export function getInvitation(sender: string, recipient: string): Invitation {
	const invite: Invitation | undefined = Main.repository.invitations.get(sender + recipient);
	if (!invite) throw new Error(sender + recipient + ': no such invitation');
	return invite;
}

// * create invitation
export function createInvitation(sender: string, recipient: string, game: Main.GameTYPE): void {
	if (sender === recipient) throw new Error('invited yourself, pretty smart huh!!');
	const sen: Main.Player = Main.getPlayer(sender);
	const rec: Main.Player = Main.getPlayer(recipient);
	if (rec.socket.PLAYFREE === false) throw new Error(rec.username + ' is currently playing');
	if (Main.repository.invitations.has(sen.username + rec.username)) return;
	Main.repository.invitations.set(sen.username + rec.username, new Invitation(sen.username, rec.username, game));
}

// * update accepted invitation
export function acceptInvitation(sender: string, recipient: string): void {
	const invite: Invitation = getInvitation(sender, recipient);
	if (invite.invite_status === 'pending') {
		invite.invite_status = 'accepted';
		cancelInvitation(sender, recipient);
		Main.addRoom(sender, recipient, invite.game, randomUUID());
	}
}

// * update declined invitation
export function declineInvitation(sender: string, recipient: string): void {
	const invite: Invitation = getInvitation(sender, recipient);
	if (invite.invite_status === 'pending') invite.invite_status = 'declined';
}

// * cancel invitation
export function cancelInvitation(sender: string, recipient: string): void {
	Main.repository.invitations.delete(sender + recipient);
}

// * delete all expired invitation
export function deleteExpiredInvitations() {
	Main.repository.invitations.forEach((value, key) => {
		if (Date.now() - value.created_at > Main.invitationTimeout) Main.repository.invitations.delete(key);
	});
}

// * cancel all player invitations
export function cancelAllPlayerInvitations(sender: string) {
	Main.repository.invitations.forEach((value, key) => {
		if (value.sender === sender) Main.repository.invitations.delete(key);
	});
}

// * delete all rejected invitation for a specific user
export function deleteAllRejectedInvitations(sender: string): void {
	Main.repository.invitations.forEach((value, key) => {
		if (value.sender === sender && value.invite_status === 'declined') Main.repository.invitations.delete(key);
	});
}

// * get all player invitations
export function getAllPlayerInvitations(username: string): Main.ClientInvitation[] {
	const invitations: Main.ClientInvitation[] = [];
	Main.repository.invitations.forEach((value) => {
		if (value.recipient === username) invitations.push(new Main.ClientInvitation(value.sender, value.game, value.invite_status));
	});
	return invitations;
}
