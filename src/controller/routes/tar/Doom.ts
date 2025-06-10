import { cardsNum, timeLimite, randInt, DoomType } from './index.js';

export class Doom {
	private _winner: string = '';
	private _BomPos: number = 0;
	private _table: DoomType[];
	private _opponent: string;
	private _player: string;
	private _myturn: string;
	private _timer: number;

	constructor(player: string, opponent: string) {
		this._myturn = player;
		this._player = player;
		this._timer = Date.now();
		this._opponent = opponent;
		this._BomPos = randInt(0, cardsNum);
		this._table = Array(cardsNum).fill('C');
	}
	flip(username: string, pos: number): void {
		if (
			(username !== this._player && username !== this._opponent) ||
			(username === this._player && this._myturn !== this._player) ||
			(username === this._opponent && this._myturn !== this._opponent)
		)
			return;
		if (pos < 0 || pos >= cardsNum) return;
		if (this._myturn === this._player) this._myturn = this._opponent;
		else this._myturn = this._player;
		if (pos === this._BomPos) this._table[pos] = 'B';
		else this._table[pos] = 'D';
		this._timer = Date.now();
		if (this._table[pos] === 'B' && username === this._player) this._winner = this._opponent;
		else if (this._table[pos] === 'B' && username === this._opponent) this._winner = this._player;
	}
	getMap(): string[] {
		return this._table;
	}
	update(): boolean {
		if (this._winner !== '') return true;
		if (Date.now() - this._timer > timeLimite && this._myturn === this._player) {
			this._myturn = this._opponent;
			this._timer = Date.now();
		} else if (Date.now() - this._timer > timeLimite && this._myturn === this._opponent) {
			this._myturn = this._player;
			this._timer = Date.now();
		}
		return false;
	}
	get timer(): number {
		return this._timer;
	}
	get myturn(): string {
		return this._myturn;
	}
	get winner(): string {
		return this._winner;
	}
}
