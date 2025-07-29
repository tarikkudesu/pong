import { format } from 'date-fns';
import * as Main from '../index.js';

export function sendGame() {
	Main.repository.players.forEach((player: Main.Player) => {
		try {
			if (player.socket.OPEN && player.socket.PLAYFREE === false) {
				const { roomState, game, opponent, playerTinyChat, opponentTinyChat } = Main.getRoom(player.socket.gid);
				if (game && game instanceof Main.Pong) {
					const { ball, leftPaddle, rightPaddle, playerScore, opponentScore, winner, sound } = game;
					let clientPong: Main.ClientPong = new Main.ClientPong({
						ball,
						sound,
						leftPaddle,
						rightPaddle,
						playerScore,
						opponentScore,
						won: winner === player.username,
						stop: roomState === 'disconnected',
						lost: winner !== '' && winner !== player.username,
						tinychat: player.username === opponent ? playerTinyChat : opponentTinyChat,
						start: roomState !== 'connecting' && roomState !== 'player-1-connected' && roomState !== 'player-2-connected',
					});
					if (player.username !== opponent) clientPong = Main.transformFrame(clientPong);
					player.socket.send(Main.PongMessage(player.username, player.socket.hash, 'pong', clientPong));
					if (clientPong.won || clientPong.lost || clientPong.stop) Main.disconnectPlayer(player);
				} else if (game && game instanceof Main.Doom) {
					const { winner, myturn, timer } = game;
					const clientDoom: Main.ClientCardOfDoom = new Main.ClientCardOfDoom({
						cards: game.getMap(),
						won: winner === player.username,
						myturn: myturn === player.username,
						stop: roomState === 'disconnected',
						lost: winner !== '' && winner !== player.username,
						timer: Math.ceil((Main.timeLimite - (Date.now() - timer)) / 1000),
						tinychat: player.username === opponent ? playerTinyChat : opponentTinyChat,
						start: roomState !== 'connecting' && roomState !== 'player-1-connected' && roomState !== 'player-2-connected',
					});
					player.socket.send(Main.DoomMessage(player.username, player.socket.hash, 'doom', clientDoom));
					if (clientDoom.won || clientDoom.lost || clientDoom.stop) Main.disconnectPlayer(player);
				}
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
		} catch (err: any) {
			player.socket.PLAYFREE = true;
			player.socket.gid = '';
		}
	});
}

export function sendTournament() {
	Main.repository.players.forEach((player: Main.Player) => {
		if (player.socket.OPEN && player.socket.PLAYFREE === true) {
			const { name, due_date, registeredPlayers, maxPlayers, matches, state, currentLevel } = Main.repository.tournament;
			const clientMatches: Set<Main.ClientTournamentMatchTYPE> = new Set();
			let gid: string = '';
			matches.forEach((e: Main.TournamentMatchTYPE) => {
				if (e.player === player.username || e.opponent === player.username) gid = e.GID;
				clientMatches.add({ player: e.player, opponent: e.opponent, finished: e.finished });
			});
			const m: string = Main.TournamentMessage(
				player.username,
				player.socket.hash,
				'pong',
				new Main.ClientTournament({
					gid,
					name,
					state,
					round: currentLevel,
					results: [...registeredPlayers],
					nextMatches: [...clientMatches],
					date: format(due_date, 'yyyy-MM-dd HH:mm'),
					emptySlots: maxPlayers - registeredPlayers.size,
					registered: [...registeredPlayers].some((e) => e.username === player.username),
				})
			);
			if (m !== player.prevTournament) {
				player.prevTournament = m;
				player.socket.send(m);
			}
		}
	});
}

export function sendInvitations() {
	Main.repository.players.forEach((player) => {
		if (player.socket.OPEN && player.socket.PLAYFREE === true) {
			const m: string = Main.InvitationMessage(player.username, player.socket.hash, 'pong', () => Main.getAllPlayerInvitations(player.username));
			if (m !== player.prevInvitations) {
				player.prevInvitations = m;
				player.socket.send(m);
			}
		}
	});
}

export function sendPool() {
	Main.repository.players.forEach((player: Main.Player) => {
		if (player.socket.OPEN && player.socket.PLAYFREE === true) {
			const m: string = Main.PoolMessage(player.username, player.socket.hash, 'pong', () => Main.getPool(player.username));
			if (m !== player.prevPool) {
				player.socket.send(m);
				player.prevPool = m;
			}
		}
	});
}
