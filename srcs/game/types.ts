export type RoomStateTYPE = 'connecting' | 'player-1-connected' | 'player-2-connected' | 'playing' | 'disconnected' | 'finished';
export type InvitationStateTYPE = 'unsent' | 'pending' | 'accepted' | 'declined';
export type TournamentStateTYPE = 'not open' | 'open' | 'playing' | 'finished';
export type PlayerStateTYPE = 'playing' | 'free';
export type GameTYPE = 'pong' | 'doom';
export type DoomType = 'C' | 'D' | 'B';

export type TournamentPlayerTYPE = {
	username: string;
	level: number;
	alias: string;
};

export type TournamentMatchTYPE = {
	opponentAlias: string;
	playerAlias: string;
	finished: boolean;
	// ! These attributes must never be on the client side, only in the server
	opponent: string;
	player: string;
	GID: string;
};

export type ClientTournamentMatchTYPE = Omit<TournamentMatchTYPE, 'GID' | 'opponentAlias' | 'playerAlias'>;

declare module 'ws' {
	interface WebSocket {
		PLAYFREE: boolean;
		username: string;
		hash: string;
		gid: string;
	}
}
