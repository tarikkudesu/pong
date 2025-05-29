import { Vector } from './pong';

const rows: number = 14;
const cols: number = 14;

export class Doom {
	private table: boolean[][];
	private BomPos: Vector = new Vector(0, 0);

	constructor() {
		this.table = Array.from({ length: rows }, () => Array(cols).fill(false));
	}

	get(row: number, col: number): boolean {
		if (row < 0 || row >= rows || col < 0 || col >= cols) throw new Error('out of bound');
		return this.table[row][col];
	}

	set(row: number, col: number): void {
		if (row < 0 || row >= rows || col < 0 || col >= cols) throw new Error('out of bound');
		if (this.table[row][col]) throw new Error('already flipped');
		this.table[row][col] = true;
	}
}
