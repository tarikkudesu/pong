import crypto from 'crypto';
import { WebSocket } from 'ws';
import { randomUUID } from 'crypto';
import { BallState, Pong, PongHeight, PongWidth, randInt } from './pong.js';
import { ClientInvitation, ClientPlayer, Frame, Hook, transformFrame, WS } from './ws-server.js';

export const invitationTimeout: number = 30000;

export function generateHash(text: string): string {
	return crypto.createHash('sha256').update(text).digest('hex');
}

export class Invitation {
	public img: string;
	public sender: string;
	public recipient: string;
	public created_at: number;
	public invite_status: 'unsent' | 'pending' | 'accepted' | 'declined';
	constructor(sender: string, recipient: string, img: string) {
		this.invite_status = 'pending';
		this.created_at = Date.now();
		this.recipient = recipient;
		this.sender = sender;
		this.img = img;
	}
}

export class Player {
	public img: string;
	public username: string;
	public socket: WebSocket;
	constructor(username: string, img: string, socket: WebSocket) {
		this.username = username;
		this.socket = socket;
		this.img = img;
	}
}

export class Room {
	// * initial setup
	public playerNoBan: number = 1;

	public playerGID: string;
	public opponentGID: string;
	public playerUsername: string;
	public opponentUsername: string;

	public player: Player | null = null;
	public opponent: Player | null = null;

	public playerScore: number = 0;
	public opponentScore: number = 0;
	public pong: Pong | null = null;
	public connectionState: 'connecting' | 'playing' | 'disconnected' = 'connecting';
	constructor(pu: string, pgid: string, ou: string, ogid: string) {
		this.playerGID = pgid;
		this.opponentGID = ogid;
		this.playerUsername = pu;
		this.opponentUsername = ou;
	}
	setup() {
		if (this.player && this.opponent && this.pong) {
			this.connectionState = 'playing';
			this.sendScore();
			let angle: number = randInt((-Math.PI / 4) * 1000, (Math.PI / 4) * 1000);
			if (this.playerNoBan === 3 || this.playerNoBan === 4) angle += Math.PI * 1000;
			this.pong.setup(angle / 1000);
			this.playerNoBan += 1;
			if (this.playerNoBan >= 5) this.playerNoBan = 1;
		}
	}
	connectPlayer(player: Player) {
		this.player = player;
		this.pong = new Pong();
		this.setup();
	}
	connectOpponent(opponent: Player) {
		this.opponent = opponent;
		this.pong = new Pong();
		this.setup();
	}
	sendScore() {
		if (this.connectionState !== 'playing') return;
		if (!this.player || !this.opponent) throw new Error('No player connected');
		if (!this.player.socket.OPEN || !this.opponent.socket.OPEN) throw new Error('Closed socket');
		this.player.socket.send(WS.ScoreMessage(this.player.username, this.player.socket.hash, this.opponentScore, this.playerScore));
		this.opponent.socket.send(WS.ScoreMessage(this.opponent.username, this.opponent.socket.hash, this.playerScore, this.opponentScore));
	}
	sendFrame() {
		if (this.connectionState !== 'playing' || !this.pong) return;
		if (!this.player || !this.opponent) throw new Error('No player connected');
		if (!this.player.socket.OPEN || !this.opponent.socket.OPEN) throw new Error('Closed socket');
		const f: Frame = new Frame(this.pong.ball, this.pong.rightPaddle, this.pong.leftpaddle);
		this.player.socket.send(WS.FrameMessage(this.player.username, this.player.socket.hash, transformFrame(f)));
		this.opponent.socket.send(WS.FrameMessage(this.opponent.username, this.opponent.socket.hash, f));
	}
	updateGame() {
		if (this.connectionState !== 'playing' || !this.player || !this.opponent) return;
		if (!this.player?.socket.OPEN) throw new Error('player disconnected: ' + this.player.username);
		if (!this.opponent?.socket.OPEN) throw new Error('opponent disconnected: ' + this.opponent.username);
		if (this.pong) {
			const ballState: BallState = this.pong.updateFrame();
			if (ballState === BallState.OUT_RIGHT) {
				this.opponentScore += 1;
				this.setup();
			} else if (ballState === BallState.OUT_LEFT) {
				this.playerScore += 1;
				this.setup();
			} else {
				this.sendFrame();
			}
			if (this.playerScore >= 7) {
				this.player.socket.send(WS.LostMessage(this.player.username, this.player.socket.hash));
				this.opponent.socket.send(WS.WonMessage(this.opponent.username, this.opponent.socket.hash));
				this.pong = null;
			} else if (this.opponentScore >= 7) {
				this.opponent.socket.send(WS.LostMessage(this.opponent.username, this.opponent.socket.hash));
				this.player.socket.send(WS.WonMessage(this.player.username, this.player.socket.hash));
				this.pong = null;
			}
		}
	}
}

class Mdb {
	private invitations: Map<string, Invitation> = new Map();
	private players: Map<string, Player> = new Map();
	private rooms: Map<string, Room> = new Map();
	constructor() {}

	// * create player
	createPlayer(username: string, img: string, socket: WebSocket): Player {
		const player: Player = new Player(username, img, socket);
		const hash: string = generateHash(username);
		socket.username = username;
		socket.PLAYFREE = true;
		socket.hash = hash;
		return player;
	}

	/***************************************************************************************************************
	 *                                           ROOM TABLE MANIPULATION                                           *
	 ***************************************************************************************************************/

	// * new room
	addRoom(pu: string, pgid: string, ou: string, ogid: string): void {
		this.rooms.set(pu + ou, new Room(pu, pgid, ou, ogid));
	}

	// * remove room
	removeRoom(player: Player, opponent: Player): void {
		this.rooms.delete(player.username + opponent.username);
	}

	// * remove room
	getRoom(player: Player, opponent: Player): Room {
		let r: Room | undefined = this.rooms.get(player.username + opponent.username);
		if (r === undefined) r = this.rooms.get(opponent.username + player.username);
		if (r === undefined) throw new Error("Room doesn't exists");
		return r;
	}

	// * connnect player to a room
	connectPlayer(player: Player, gid: string) {
		this.rooms.forEach((value) => {
			if (value.playerUsername === player.username && value.playerGID === gid) value.connectPlayer(player);
			else if (value.opponentUsername === player.username && value.opponentGID === gid) value.connectOpponent(player);
		});
	}

	disconnectPlayer(username: string): void {
		this.rooms.forEach((value) => {
			if (value.playerUsername === username) {
				this.getPlayer(username).socket.PLAYFREE = true;
				value.player = null;
			} else if (value.opponentUsername === username) {
				this.getPlayer(username).socket.PLAYFREE = true;
				value.opponent = null;
			}
		});
	}

	// * room hook
	roomHook(username: string, hook: Hook): void {
		this.rooms.forEach((value) => {
			if (value.player?.username === username) value.pong?.keyPressLeft(hook.up, hook.down);
			if (value.opponent?.username === username) value.pong?.keyPressRight(hook.up, hook.down);
		});
	}

	// * update rooms
	updateRooms(): void {
		this.rooms.forEach((value) => {
			value.updateGame();
		});
	}

	/****************************************************************************************************************
	 *                                        PLAYERS TABLE MANIPULATION                                            *
	 ****************************************************************************************************************/

	// * add player
	addPlayer(player: Player): void {
		if (this.checkIfPlayerExists(player.username)) throw new Error('Player already exists');
		this.players.set(player.username, player);
	}
	// * remove player
	removePlayer(username: string) {
		this.players.delete(username);
	}
	// * get player Hash
	getPlayerHash(username: string): string {
		const player: Player | undefined = this.players.get(username);
		if (!player) throw new Error("Player-hash doesn't exists");
		return player.socket.hash;
	}
	// * get player
	getPlayer(username: string): Player {
		const player: Player | undefined = this.players.get(username);
		if (!player) throw new Error("Player-object doesn't exists");
		return player;
	}
	// * check if Player exists
	checkIfPlayerExists(username: string): boolean {
		if (this.players.get(username)) return true;
		return false;
	}
	getPool(username: string): ClientPlayer[] {
		const player: Player = this.getPlayer(username);
		const pool: ClientPlayer[] = [];
		this.players.forEach((value, key) => {
			if (value.username !== username) {
				try {
					pool.push(new ClientPlayer(value.username, value.img, this.getInvitation(player, value).invite_status));
				} catch (err: any) {
					pool.push(new ClientPlayer(value.username, value.img, 'unsent'));
				}
			}
		});
		return pool;
	}
	/****************************************************************************************************************
	 *                                      INVITATIONS TABLE MANIPULATION                                          *
	 ****************************************************************************************************************/
	// ? invite_status manipulation queries

	getInvitation(sender: Player, recipient: Player): Invitation {
		const invite: Invitation | undefined = this.invitations.get(sender.username + recipient.username);
		if (!invite) throw new Error(sender.username + ', ' + recipient.username + ': no such invitation');
		return invite;
	}
	// * create invitation
	createInvitation(sender: string, recipient: string): void {
		const sen: Player = this.getPlayer(sender);
		const rec: Player = this.getPlayer(recipient);
		if (sen.username === rec.username) throw new Error('invited yourself, pretty smart huh!!');
		if (this.invitations.get(sen.username + rec.username))
			throw new Error('stop trying to send invitation to this player, he already got one from you');
		this.invitations.set(sen.username + rec.username, new Invitation(sen.username, rec.username, sen.img));
	}
	// * update accepted invitation
	acceptInvitation(sender: string, recipient: string): void {
		const sen: Player = this.getPlayer(sender);
		const rec: Player = this.getPlayer(recipient);
		if (sen.username === rec.username) throw new Error('you are trying to accept an invite to yourself, pretty smart huh!!');
		const invite: Invitation = this.getInvitation(sen, rec);
		if (invite.invite_status === 'pending') {
			const senGID: string = randomUUID();
			const recGID: string = randomUUID();
			invite.invite_status = 'accepted';
			sen.socket.PLAYFREE = false;
			rec.socket.PLAYFREE = false;
			this.addRoom(sen.username, senGID, rec.username, recGID);
			sen.socket.send(WS.PlayMessage(sen.username, sen.socket.hash, senGID));
			rec.socket.send(WS.PlayMessage(rec.username, rec.socket.hash, recGID));
		}
	}
	// * update declined invitation
	declineInvitation(sender: string, recipient: string): void {
		const sen: Player = this.getPlayer(sender);
		const rec: Player = this.getPlayer(recipient);
		if (sen.username === rec.username) throw new Error('you are trying to accept an invite to yourself, pretty smart huh!!');
		const invite: Invitation = this.getInvitation(sen, rec);
		if (invite.invite_status === 'pending') invite.invite_status = 'declined';
	}
	// * cancel invitation
	cancelInvitation(sender: string, recipient: string): void {
		const sen: Player = this.getPlayer(sender);
		const rec: Player = this.getPlayer(recipient);
		this.invitations.delete(sen.username + rec.username);
	}
	// * delete all expired invitation
	deleteExpiredInvitations() {
		[...this.invitations.values()].forEach((ele) => {
			if (Date.now() - ele.created_at > invitationTimeout) {
				this.invitations.delete(ele.sender + ele.recipient);
			}
		});
	}
	// * cancel all player invitations
	cancelAllPlayerInvitations(sender: string) {
		if (!this.checkIfPlayerExists(sender)) throw new Error("cancel all player invitations: player doesn't exist");
		const invitations: Invitation[] = [];
		this.invitations.forEach((value) => {
			if (value.sender === sender) invitations.push(value);
		});
		invitations.forEach((value) => {
			this.invitations.delete(sender + value.recipient);
		});
	}
	// * delete a rejected invitation for a specific user
	deleteRejectedInvitation(sender: string, recipient: string) {
		this.cancelInvitation(sender, recipient);
	}
	// * delete all rejected invitation for a specific user
	deleteAllRejectedInvitations(sender: string): void {
		[...this.invitations.values()].forEach((invite) => {
			if (invite.sender === sender && invite.invite_status === 'declined') {
				this.invitations.delete(invite.sender + invite.recipient);
			}
		});
	}
	// * get all player invitations
	getAllPlayerInvitations(username: string): ClientInvitation[] {
		if (!this.checkIfPlayerExists(username)) throw new Error("get all player invitations: player doesn't exist");
		const invitations: ClientInvitation[] = [];
		this.invitations.forEach((value) => {
			if (value.recipient === username) invitations.push(new ClientInvitation(value.sender, value.img, value.invite_status));
		});
		return invitations;
	}
	/************************************************************************************************************************
	 *                                                         MAIN                                                         *
	 ************************************************************************************************************************/

	updateMdb() {
		this.deleteExpiredInvitations();
	}
	updateClient() {
		this.players.forEach((value) => {
			if (value.socket.readyState === WebSocket.OPEN) {
				value.socket.send(
					WS.InvitationMessage(value.username, value.socket.hash, () => this.getAllPlayerInvitations(value.username))
				);
				value.socket.send(WS.PoolMessage(value.username, value.socket.hash, () => this.getPool(value.username)));
			}
		});
	}
}

export const mdb = new Mdb();
