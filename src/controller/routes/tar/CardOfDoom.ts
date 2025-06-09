import { randInt } from './pong.js';

const cardsNum: number = 25;
export const timeLimite: number = 10000;

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
		this.timer = Date.now();
		this.opponent = opponent;
		this.table = Array(cardsNum).fill('C');
		this.BomPos = randInt(0, cardsNum);
	}
	flip(username: string, pos: number): void {
		if ((username !== this.player && username !== this.opponent) || (username === this.player && this.myturn !== this.player) || (username === this.opponent && this.myturn !== this.opponent))
			return;
		if (pos < 0 || pos >= cardsNum) return;
		if (this.myturn === this.player) this.myturn = this.opponent;
		else this.myturn = this.player;
		if (pos === this.BomPos) this.table[pos] = 'B';
		else this.table[pos] = 'D';
		this.timer = Date.now();
		if (this.table[pos] === 'B' && username === this.player) this.winner = this.opponent;
		else if (this.table[pos] === 'B' && username === this.opponent) this.winner = this.player;
	}
	getMap(): string[] {
		return this.table;
	}
	update(): boolean {
		if (this.winner !== '') return true;
		if (Date.now() - this.timer > timeLimite && this.myturn === this.player) {
			this.myturn = this.opponent;
			this.timer = Date.now();
		} else if (Date.now() - this.timer > timeLimite && this.myturn === this.opponent) {
			this.myturn = this.player;
			this.timer = Date.now();
		}
		return false;
	}
}
