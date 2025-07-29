import * as Main from '../index.js';

export function ErrorMessage(error: string) {
	return JSON.stringify(new Main.Message({ username: '', hash: '', game: 'pong', message: 'ERROR', data: new Main.WSError(error) }));
}

// * POOL : HASH | PLAY | POOL | INVITATIONS
export function HashMessage(username: string, hash: string, game: Main.GameTYPE): string {
	return JSON.stringify(new Main.Message({ username, hash, message: 'HASH', game, data: new Main.Hash(username, hash) }));
}

export function PlayMessage(username: string, hash: string, game: Main.GameTYPE, gid: string): string {
	return JSON.stringify(new Main.Message({ username, hash, message: 'PLAY', game, data: new Main.Play(gid) }));
}

export function PoolMessage(username: string, hash: string, game: Main.GameTYPE, getClientPlayers: () => Main.ClientPlayer[]): string {
	return JSON.stringify(new Main.Message({ username, hash, message: 'POOL', game, data: new Main.Pool(getClientPlayers()) }));
}

export function InvitationMessage(username: string, hash: string, game: Main.GameTYPE, getInvitions: () => Main.ClientInvitation[]): string {
	return JSON.stringify(new Main.Message({ username, hash, message: 'INVITATIONS', game, data: new Main.Invitations(getInvitions()) }));
}

export function TournamentMessage(username: string, hash: string, game: Main.GameTYPE, clientTournament: Main.ClientTournament): string {
	return JSON.stringify(new Main.Message({ username, hash, message: 'TOURNAMENT', game, data: clientTournament }));
}

// * GAME : PONG | CARDOFDOOM
export function PongMessage(username: string, hash: string, game: Main.GameTYPE, clientPong: Main.ClientPong) {
	return JSON.stringify(new Main.Message({ username, hash, message: 'PONG', game, data: clientPong }));
}

export function DoomMessage(username: string, hash: string, game: Main.GameTYPE, clientCardOfDoom: Main.ClientCardOfDoom) {
	return JSON.stringify(new Main.Message({ username, hash, message: 'DOOM', game, data: clientCardOfDoom }));
}
