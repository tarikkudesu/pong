import { randInt } from './pong.js';

const cardsNum: number = 25;

// TODO:          C C C C C
// TODO:          C D C C C
// TODO:          C C B C C
// TODO:          C C C C C
// TODO:          C C C C C

// * C === Closed
// * B === Bomb
// * D === Diamond

export class Doom {
	private table: string[];
	private BomPos: number = 0;

	constructor() {
		this.table = Array(cardsNum).fill('C');
		this.BomPos = randInt(0, cardsNum);
	}
	flip(pos: number): boolean {
		if (pos < 0 || pos >= cardsNum) throw new Error('out of bound');
		if (pos === this.BomPos) this.table[pos] = 'B';
		else this.table[pos] = 'D';
		return this.table[pos] === 'B';
	}
	getMap(): string[] {
		return this.table;
	}
}
