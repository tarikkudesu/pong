import crypto from 'crypto';

export function generateHash(text: string): string {
	return crypto.createHash('sha256').update(text).digest('hex');
}
export function randInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
