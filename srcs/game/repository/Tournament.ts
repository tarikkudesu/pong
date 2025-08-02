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
	constructor() {}
}

function newTournament() {
	const customConfig: Config = {
		dictionaries: [adjectives, starWars],
		separator: '-',
		length: 2,
	};
	const date: Date = new Date();
	Main.repository.tournament.matches.clear();
	Main.repository.tournament.currentLevel = 0;
	Main.repository.tournament.state = 'not open';
	Main.repository.tournament.registeredPlayers.clear();
	Main.repository.tournament.name = uniqueNamesGenerator(customConfig);
	Main.repository.tournament.due_date = new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
		date.getHours(),
		date.getMinutes() + 1
	).getTime();
}

function levelup(player: string) {
	for (const p of Main.repository.tournament.registeredPlayers) if (p.username === player) p.level += 1;
}

export function registerRoomResult(room: Main.Room, key: string) {
	Main.repository.tournament.matches.forEach((match) => {
		if (match.GID === key) {
			if (room.game) {
				if (room.game.winner === match.player) levelup(match.player);
				else levelup(match.opponent);
			}
			Main.repository.tournament.matches.delete(match);
			return;
		}
	});
}

/***************************************************************************************************************
 *                                        TOURNAMENT TABLE MANIPULATION                                        *
 ***************************************************************************************************************/

export function createTournamentMatch(player: Main.TournamentPlayerTYPE, opponent: Main.TournamentPlayerTYPE) {
	const GID: string = randomUUID();
	Main.repository.tournament.matches.add({
		player: player.username,
		opponent: opponent.username,
		playerAlias: player.alias,
		opponentAlias: opponent.alias,
		finished: false,
		GID,
	});
	Main.repository.rooms.set(GID, new Main.Room(player.username, opponent.username));
}

export function register(username: string, alias: string) {
	if (Date.now() < Main.repository.tournament.due_date) throw new Error('Registration is not open yet my friend');
	if (Main.repository.tournament.registeredPlayers.size >= Main.repository.tournament.maxPlayers) throw new Error('Tournament is Full');
	if (![...Main.repository.tournament.registeredPlayers].some((e) => e.username === username))
		Main.repository.tournament.registeredPlayers.add({ alias, username, level: 0 });
	if (Main.repository.tournament.registeredPlayers.size === Main.repository.tournament.maxPlayers)
		Main.repository.tournament.state = 'playing';
}

export function updateTournament() {
	switch (Main.repository.tournament.state) {
		case 'new': {
			newTournament();
			Main.repository.tournament.state = 'not open';
			break;
		}
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
				const winners: Main.TournamentPlayerTYPE[] = [...Main.repository.tournament.registeredPlayers]
					.filter((e) => e.level === Main.repository.tournament.currentLevel)
					.sort();
				if (winners.length === 1 || winners.length === 0) Main.repository.tournament.state = 'finished';
				else {
					Main.repository.tournament.matches.clear();
					for (let i = 0; i < winners.length; i++) {
						if (i + 1 < winners.length) {
							createTournamentMatch(winners[i], winners[i + 1]);
							i++;
						} else {
							levelup(winners[i].username);
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
			Main.repository.tournament.state = 'new';
			break;
		}
	}
}
