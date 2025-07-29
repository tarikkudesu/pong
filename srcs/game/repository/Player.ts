import * as Main from '../index.js';
import { WebSocket } from 'ws';

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

// * create player
export function createPlayer(username: string, socket: WebSocket): Player {
	const player: Player = new Player(username, socket);
	const hash: string = Main.generateHash(username);
	socket.username = username;
	socket.PLAYFREE = true;
	socket.hash = hash;
	socket.gid = '';
	return player;
}

/****************************************************************************************************************
 *                                        PLAYERS TABLE MANIPULATION                                            *
 ****************************************************************************************************************/

// * add player
export function addPlayer(player: Player): void {
	if (Main.repository.players.has(player.username)) throw new Error('Player already exists');
	Main.repository.players.set(player.username, player);
	player.socket.send(Main.HashMessage(player.username, player.socket.hash, 'pong'));
}

// * remove player
export function removePlayer(username: string) {
	Main.repository.players.delete(username);
}

// * get player Hash
export function getPlayerHash(username: string): string {
	const player: Player | undefined = Main.repository.players.get(username);
	if (!player) throw new Error("Player-hash doesn't exists");
	return player.socket.hash;
}

// * get player
export function getPlayer(username: string): Player {
	const player: Player | undefined = Main.repository.players.get(username);
	if (!player) throw new Error("Player-object doesn't exists");
	return player;
}

export function getPool(username: string): Main.ClientPlayer[] {
	const pool: Main.ClientPlayer[] = [];
	Main.repository.players.forEach((value) => {
		if (value.username !== username) {
			try {
				const i: Main.Invitation = Main.getInvitation(username, value.username);
				pool.push(new Main.ClientPlayer(value.username, i.game, value.socket.PLAYFREE === true ? 'free' : 'playing', i.invite_status));
				// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
			} catch (err: any) {
				pool.push(new Main.ClientPlayer(value.username, 'pong', value.socket.PLAYFREE === true ? 'free' : 'playing', 'unsent'));
			}
		}
	});
	return pool;
}
