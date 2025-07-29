import * as Main from '../index.js';

class Repository {
	public invitations: Map<string, Main.Invitation> = new Map();
	public players: Map<string, Main.Player> = new Map();
	public rooms: Map<string, Main.Room> = new Map();
	public tournament = new Main.Tournament();
	constructor() {}
}

export const repository = new Repository();
