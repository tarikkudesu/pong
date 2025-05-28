import crypto from 'crypto';
import { WebSocket } from 'ws';
import { BallState, Pong, randInt } from './game/index.js';
import { ClientInvitation, ClientPlayer, Frame, transformFrame, WS } from './ws-server.js';
import { randomUUID } from 'crypto';
export const invitationTimeout = 30000;
export function generateHash(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
}
export class Invitation {
    constructor(sender, recipient, img) {
        this.invite_status = 'pending';
        this.created_at = Date.now();
        this.recipient = recipient;
        this.sender = sender;
        this.img = img;
    }
}
export class Player {
    constructor(username, img, socket) {
        this.username = username;
        this.socket = socket;
        this.img = img;
    }
}
export class Room {
    constructor(pu, pgid, ou, ogid) {
        // * initial setup
        this.playerNoBan = 1;
        this.player = null;
        this.opponent = null;
        this.playerScore = 0;
        this.opponentScore = 0;
        this.pong = null;
        this.connectionState = 'connecting';
        this.playerGID = pgid;
        this.opponentGID = ogid;
        this.playerUsername = pu;
        this.opponentUsername = ou;
    }
    setup() {
        if (this.player && this.opponent) {
            this.connectionState = 'playing';
            this.sendScore();
            this.pong = new Pong();
            let angle = randInt((-Math.PI / 4) * 1000, (Math.PI / 4) * 1000);
            if (this.playerNoBan === 3 || this.playerNoBan === 4)
                angle += Math.PI * 1000;
            this.pong.setup(angle / 1000);
            this.playerNoBan += 1;
            if (this.playerNoBan >= 5)
                this.playerNoBan = 1;
        }
    }
    connectPlayer(player) {
        console.log('Connecting player');
        this.player = player;
        this.setup();
    }
    connectOpponent(opponent) {
        console.log('Connecting opponent');
        this.opponent = opponent;
        this.setup();
    }
    sendScore() {
        if (this.connectionState !== 'playing' || !this.player || !this.opponent)
            return;
        this.player.socket.send(WS.ScoreMessage(this.player.username, this.player.socket.hash, this.opponentScore, this.playerScore));
        this.opponent.socket.send(WS.ScoreMessage(this.opponent.username, this.opponent.socket.hash, this.playerScore, this.opponentScore));
    }
    sendFrame() {
        if (this.connectionState !== 'playing' || !this.player || !this.opponent || !this.pong)
            return;
        const f = new Frame(this.pong.ball, this.pong.rightPaddle, this.pong.leftpaddle);
        this.player.socket.send(WS.FrameMessage(this.player.username, this.player.socket.hash, transformFrame(f, 1024, 768)));
        this.opponent.socket.send(WS.FrameMessage(this.opponent.username, this.opponent.socket.hash, f));
    }
    updateGame() {
        if (this.connectionState !== 'playing' || !this.player || !this.opponent)
            return;
        if (!this.player?.socket.OPEN)
            throw new Error('player disconnected: ' + this.player.username);
        if (!this.opponent?.socket.OPEN)
            throw new Error('opponent disconnected: ' + this.opponent.username);
        if (this.pong) {
            const ballState = this.pong.updateFrame();
            if (ballState === BallState.OUT_RIGHT) {
                this.opponentScore += 1;
                this.setup();
            }
            else if (ballState === BallState.OUT_LEFT) {
                this.playerScore += 1;
                this.setup();
            }
            else {
                this.sendFrame();
            }
            if (this.playerScore >= 7) {
                this.player.socket.send(WS.LostMessage(this.player.username, this.player.socket.hash));
                this.opponent.socket.send(WS.WonMessage(this.opponent.username, this.opponent.socket.hash));
                this.pong = null;
            }
            else if (this.opponentScore >= 7) {
                this.opponent.socket.send(WS.LostMessage(this.opponent.username, this.opponent.socket.hash));
                this.player.socket.send(WS.WonMessage(this.player.username, this.player.socket.hash));
                this.pong = null;
            }
        }
    }
}
class Mdb {
    constructor() {
        this.invitations = new Map();
        this.players = new Map();
        this.rooms = new Map();
    }
    // * create player
    createPlayer(username, img, socket) {
        const player = new Player(username, img, socket);
        const hash = generateHash(username);
        socket.username = username;
        socket.hash = hash;
        return player;
    }
    /***************************************************************************************************************
     *                                           ROOM TABLE MANIPULATION                                           *
     ***************************************************************************************************************/
    // * new room
    addRoom(pu, pgid, ou, ogid) {
        this.rooms.set(pu + ou, new Room(pu, pgid, ou, ogid));
        console.log(this.rooms.values());
    }
    // * remove room
    removeRoom(player, opponent) {
        this.rooms.delete(player.username + opponent.username);
    }
    // * remove room
    getRoom(player, opponent) {
        let r = this.rooms.get(player.username + opponent.username);
        if (r === undefined)
            r = this.rooms.get(opponent.username + player.username);
        if (r === undefined)
            throw new Error("Room doesn't exists");
        return r;
    }
    // * connnect player to a room
    connectPlayer(player, gid) {
        this.rooms.forEach((value) => {
            if (value.playerUsername === player.username && value.playerGID === gid)
                value.connectPlayer(player);
            else if (value.opponentUsername === player.username && value.opponentGID === gid)
                value.connectOpponent(player);
        });
    }
    disconnectPlayer(username) {
        this.rooms.forEach((value) => {
            if (value.playerUsername === username)
                value.player = null;
            else if (value.opponentUsername === username)
                value.opponent = null;
        });
    }
    // * room hook
    roomHook(username, hook) {
        this.rooms.forEach((value) => {
            if (value.player?.username === username)
                value.pong?.keyPressLeft(hook.up, hook.down);
            if (value.opponent?.username === username)
                value.pong?.keyPressRight(hook.up, hook.down);
        });
    }
    // * update rooms
    updateRooms() {
        this.rooms.forEach((value) => {
            value.updateGame();
        });
    }
    /****************************************************************************************************************
     *                                        PLAYERS TABLE MANIPULATION                                            *
     ****************************************************************************************************************/
    // * add player
    addPlayer(player) {
        if (this.checkIfPlayerExists(player.username))
            throw new Error('Player already exists');
        this.players.set(player.username, player);
    }
    // * remove player
    removePlayer(username) {
        this.players.delete(username);
    }
    // * get player Hash
    getPlayerHash(username) {
        const player = this.players.get(username);
        if (!player)
            throw new Error("Player-hash doesn't exists");
        return player.socket.hash;
    }
    // * get player
    getPlayer(username) {
        const player = this.players.get(username);
        if (!player)
            throw new Error("Player-object doesn't exists");
        return player;
    }
    // * check if Player exists
    checkIfPlayerExists(username) {
        if (this.players.get(username))
            return true;
        return false;
    }
    getPool(username) {
        const player = this.getPlayer(username);
        const pool = [];
        this.players.forEach((value, key) => {
            if (value.username !== username) {
                try {
                    pool.push(new ClientPlayer(value.username, value.img, this.getInvitation(player, value).invite_status));
                }
                catch (err) {
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
    getInvitation(sender, recipient) {
        const invite = this.invitations.get(sender.username + recipient.username);
        if (!invite)
            throw new Error(sender.username + ', ' + recipient.username + ': no such invitation');
        return invite;
    }
    // * create invitation
    createInvitation(sender, recipient) {
        const sen = this.getPlayer(sender);
        const rec = this.getPlayer(recipient);
        if (sen.username === rec.username)
            throw new Error('invited yourself, pretty smart huh!!');
        if (this.invitations.get(sen.username + rec.username))
            throw new Error('stop trying to send invitation to this player, he already got one from you');
        this.invitations.set(sen.username + rec.username, new Invitation(sen.username, rec.username, sen.img));
    }
    // * update accepted invitation
    acceptInvitation(sender, recipient) {
        const sen = this.getPlayer(sender);
        const rec = this.getPlayer(recipient);
        if (sen.username === rec.username)
            throw new Error('you are trying to accept an invite to yourself, pretty smart huh!!');
        const invite = this.getInvitation(sen, rec);
        if (invite.invite_status === 'pending') {
            invite.invite_status = 'accepted';
            const senGID = randomUUID();
            const recGID = randomUUID();
            this.addRoom(sen.username, senGID, rec.username, recGID);
            this.removePlayer(sen.username);
            this.removePlayer(rec.username);
            sen.socket.send(WS.PlayMessage(sen.username, sen.socket.hash, senGID));
            rec.socket.send(WS.PlayMessage(rec.username, rec.socket.hash, recGID));
        }
    }
    // * update declined invitation
    declineInvitation(sender, recipient) {
        const sen = this.getPlayer(sender);
        const rec = this.getPlayer(recipient);
        if (sen.username === rec.username)
            throw new Error('you are trying to accept an invite to yourself, pretty smart huh!!');
        const invite = this.getInvitation(sen, rec);
        if (invite.invite_status === 'pending')
            invite.invite_status = 'declined';
    }
    // * cancel invitation
    cancelInvitation(sender, recipient) {
        const sen = this.getPlayer(sender);
        const rec = this.getPlayer(recipient);
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
    cancelAllPlayerInvitations(sender) {
        if (!this.checkIfPlayerExists(sender))
            throw new Error("cancel all player invitations: player doesn't exist");
        const invitations = [];
        this.invitations.forEach((value) => {
            if (value.sender === sender)
                invitations.push(value);
        });
        invitations.forEach((value) => {
            this.invitations.delete(sender + value.recipient);
        });
    }
    // * delete a rejected invitation for a specific user
    deleteRejectedInvitation(sender, recipient) {
        this.cancelInvitation(sender, recipient);
    }
    // * delete all rejected invitation for a specific user
    deleteAllRejectedInvitations(sender) {
        [...this.invitations.values()].forEach((invite) => {
            if (invite.sender === sender && invite.invite_status === 'declined') {
                this.invitations.delete(invite.sender + invite.recipient);
            }
        });
    }
    // * get all player invitations
    getAllPlayerInvitations(username) {
        if (!this.checkIfPlayerExists(username))
            throw new Error("get all player invitations: player doesn't exist");
        const invitations = [];
        this.invitations.forEach((value) => {
            if (value.recipient === username)
                invitations.push(new ClientInvitation(value.sender, value.img, value.invite_status));
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
                value.socket.send(WS.InvitationMessage(value.username, value.socket.hash, () => this.getAllPlayerInvitations(value.username)));
                value.socket.send(WS.PoolMessage(value.username, value.socket.hash, () => this.getPool(value.username)));
            }
        });
    }
}
export const mdb = new Mdb();
