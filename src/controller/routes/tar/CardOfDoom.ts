import { randInt } from './pong.js';

const cardsNum: number = 25;
export const timeLimite: number = 10000;

// TODO:          C C C C C
// TODO:          C D C C C
// TODO:          C C B C C
// TODO:          C C C C C
// TODO:          C C C C C

// * C === Closed
// * B === Bomb
// * D === Diamond

export class Doom {
	public winner: string = '';
	private BomPos: number = 0;
	private table: string[];
	public opponent: string;
	public timer: number;
	public player: string;
	public myturn: string;

	constructor(player: string, opponent: string) {
		this.myturn = player;
		this.player = player;
		this.opponent = opponent;
		this.table = Array(cardsNum).fill('C');
		this.BomPos = randInt(0, cardsNum);
	}
	flip(username: string, pos: number): void {
		if (
			(username !== this.player && username !== this.opponent) ||
			(username === this.player && this.myturn !== this.player) ||
			(username === this.opponent && this.myturn !== this.opponent)
		)
			return;
		if (pos < 0 || pos >= cardsNum) throw new Error('out of bound');
		if (pos === this.BomPos) this.table[pos] = 'B';
		else this.table[pos] = 'D';
		this.timer = Date.now();
		if (this.table[pos] === 'B') this.winner = username;
	}
	getMap(): string[] {
		return this.table;
	}
	update() {
		if (Date.now() - this.timer > timeLimite && this.myturn === this.player) this.myturn = this.opponent;
		else if (Date.now() - this.timer > timeLimite && this.myturn === this.opponent) this.myturn = this.player;
	}
}

interface ClientCardOfDoomProps {
	won: boolean;
	stop: boolean;
	lost: boolean;
	timer: number;
	start: boolean;
	myturn: boolean;
	cards: string[];
}

export class ClientCardOfDoom {
	public cards: string[];
	public start: boolean = false;
	public stop: boolean = false;
	public lost: boolean = false;
	public won: boolean = false;
	public myturn: boolean;
	public timer: number;
	constructor({ cards, myturn, timer, start, stop, lost, won }: ClientCardOfDoomProps) {
		this.myturn = myturn;
		this.timer = timer;
		this.start = start;
		this.cards = cards;
		this.stop = stop;
		this.lost = lost;
		this.won = won;
	}
}
