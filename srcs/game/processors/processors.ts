import * as Main from '../index.js';
import { WebSocket } from 'ws';
import _ from 'lodash';

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

/************************************************************************************************************************
 *                                                        PARSER                                                        *
 ************************************************************************************************************************/
export function useParser(json: string, socket: WebSocket) {
	const { username, message, hash, game, data } = Json({ message: json, target: Main.Message.instance });
	if (message !== 'CONNECT' && hash !== Main.getPlayerHash(username)) throw new Error('hash mismatch');
	console.log(username, message);
	switch (message) {
		case 'CONNECT': {
			Main.addPlayer(Main.createPlayer(username, socket));
			break;
		}
		case 'REGISTER': {
			Main.register(username, Json({ message: data, target: Main.Register.instance }).alias);
			break;
		}
		case 'ENGAGE': {
			Main.connectPlayer(username, Json({ message: data, target: Main.Engage.instance }).gid, game);
			break;
		}
		case 'INVITE': {
			Main.createInvitation(username, Json({ message: data, target: Main.Invite.instance }).recipient, game);
			break;
		}
		case 'ACCEPT': {
			Main.acceptInvitation(Json({ message: data, target: Main.Invite.instance }).recipient, username);
			break;
		}
		case 'REJECT': {
			Main.declineInvitation(Json({ message: data, target: Main.Invite.instance }).recipient, username);
			break;
		}
		case 'DELETE': {
			const invite: Main.Invite = Json({ message: data, target: Main.Invite.instance });
			if (invite.recipient === '*') Main.deleteAllRejectedInvitations(username);
			else Main.cancelInvitation(invite.recipient, username);
			break;
		}
		case 'HOOK': {
			Main.roomHook(username, Json({ message: data, target: Main.Hook.instance }));
			break;
		}
		case 'FLIP': {
			Main.roomFlip(username, Json({ message: data, target: Main.Flip.instance }));
			break;
		}
		case 'TYNICHAT': {
			Main.roomTinyChat(username, Json({ message: data, target: Main.TinyChat.instance }));
			break;
		}
		default:
			throw new Error('UNKNOWN COMMAND');
	}
}
