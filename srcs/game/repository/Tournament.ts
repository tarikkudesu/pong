import { Config, adjectives, starWars, uniqueNamesGenerator } from 'unique-names-generator';
import * as Main from '../index.js';
import { randomUUID } from 'crypto';

export class Tournament {
	public name: string = '';
	public due_date: number = 0;
	public maxPlayers: number = 5;
	public currentLevel: number = 0;
	public state: Main.TournamentStateTYPE = 'finished';
	public matches: Set<Main.TournamentMatchTYPE> = new Set();
	public registeredPlayers: Set<Main.TournamentPlayerTYPE> = new Set();
	constructor() {
		this.newTournament();
	}
	newTournament() {
		const customConfig: Config = {
			dictionaries: [adjectives, starWars],
			separator: '-',
			length: 2,
		};
		const date: Date = new Date();
		this.matches.clear();
		this.currentLevel = 0;
		this.state = 'not open';
		this.registeredPlayers.clear();
		this.name = uniqueNamesGenerator(customConfig);
		this.due_date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes() + 1).getTime();
	}
	register(player: string, alias: string) {
		if (Date.now() < this.due_date) throw new Error('Registration is not open yet my friend');
		if (this.registeredPlayers.size >= this.maxPlayers) throw new Error('Tournament is Full');
		if (![...this.registeredPlayers].some((e) => e.username === player)) this.registeredPlayers.add({ alias, username: player, level: 0 });
		if (this.registeredPlayers.size === this.maxPlayers) this.state = 'playing';
	}
	levelup(player: string) {
		for (const p of this.registeredPlayers) if (p.username === player) p.level += 1;
	}
	registerRoomResult(room: Main.Room, key: string) {
		this.matches.forEach((match) => {
			if (match.GID === key) {
				if (room.game) {
					if (room.game.winner === match.player) this.levelup(match.player);
					else this.levelup(match.opponent);
				}
				this.matches.delete(match);
				return;
			}
		});
	}
}

/***************************************************************************************************************
 *                                        TOURNAMENT TABLE MANIPULATION                                        *
 ***************************************************************************************************************/

export function createTournamentMatch(player: Main.TournamentPlayerTYPE, opponent: Main.TournamentPlayerTYPE) {
	const GID: string = randomUUID();
	Main.repository.tournament.matches.add({ player: player.username, opponent: opponent.username, playerAlias: player.alias, opponentAlias: opponent.alias, finished: false, GID });
	Main.repository.rooms.set(GID, new Main.Room(player.username, opponent.username));
}

export function register(username: string, alias: string) {
	Main.repository.tournament.register(username, alias);
}

export function updateTournament() {
	switch (Main.repository.tournament.state) {
		case 'not open': {
			if (Date.now() >= Main.repository.tournament.due_date) Main.repository.tournament.state = 'open';
			break;
		}
		case 'open': {
			break;
		}
		case 'playing': {
			[...Main.repository.tournament.matches].forEach((ele) => {
				if (ele.finished) Main.repository.tournament.matches.delete(ele);
			});
			if (Main.repository.tournament.matches.size === 0) {
				// TODO: Next Matches
				const winners: Main.TournamentPlayerTYPE[] = [...Main.repository.tournament.registeredPlayers].filter((e) => e.level === Main.repository.tournament.currentLevel).sort();
				if (winners.length === 1 || winners.length === 0) Main.repository.tournament.state = 'finished';
				else {
					Main.repository.tournament.matches.clear();
					for (let i = 0; i < winners.length; i++) {
						if (i + 1 < winners.length) {
							createTournamentMatch(winners[i], winners[i + 1]);
							i++;
						} else {
							Main.repository.tournament.levelup(winners[i].username);
						}
					}
					Main.repository.tournament.currentLevel += 1;
				}
			}
			break;
		}
		case 'finished': {
			// TODO:    DATABASE    INTERACTION    HERE
			// TODO:    DATABASE    INTERACTION    HERE
			// TODO:    DATABASE    INTERACTION    HERE
			// TODO:    DATABASE    INTERACTION    HERE
			Main.repository.tournament.newTournament();
			break;
		}
	}
}
