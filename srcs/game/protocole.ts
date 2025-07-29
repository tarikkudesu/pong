import * as Main from './index.js';
import { WebSocket } from 'ws';

export function closeSocket(socket: WebSocket) {
	if (socket.username) {
		if (socket.PLAYFREE === false) {
			try {
				const room: Main.Room = Main.getRoom(socket.gid);
				room.roomState = 'disconnected';
				room.date_at = Date.now();
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
			} catch (err: any) {
				/* empty */
			}
		}
		Main.cancelAllPlayerInvitations(socket.username);
		Main.removePlayer(socket.username);
	}
}

export function eventEntry(message: string, socket: WebSocket) {
	try {
		Main.useParser(message, socket);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		socket.send(Main.ErrorMessage("you didn't pong good enough"));
		console.error('Error', error.message);
	}
}

// * Main Loop
export function main() {
	setInterval(() => {
		Main.deleteExpiredInvitations();
		Main.updateTournament();
		Main.updateRooms();
		Main.sendPool();
		Main.sendGame();
		Main.sendInvitations();
		Main.sendTournament();
	}, 1000 / 60);
}
