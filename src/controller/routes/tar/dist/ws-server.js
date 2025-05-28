import { Ball, Vector, Paddle } from './game/index.js';
import { mdb } from './mdb.js';
import _ from 'lodash';
export class Message {
    constructor({ username, hash, message, data }) {
        this.data = JSON.stringify(data);
        this.username = username;
        this.message = message;
        this.hash = hash;
    }
}
Message.instance = new Message({ username: '', hash: '', message: '', data: {} });
export class WSError {
    constructor(error) {
        this.message = error;
    }
}
WSError.instance = new WSError('');
export class Hash {
    constructor(username, img, hash) {
        this.username = username;
        this.hash = hash;
        this.img = img;
    }
}
Hash.instance = new Hash('', '', '');
export class ClientPlayer {
    constructor(username, img, invite_status) {
        this.invite_status = invite_status;
        this.username = username;
        this.img = img;
    }
}
ClientPlayer.instance = new ClientPlayer('', '', 'unsent');
export class ClientInvitation {
    constructor(sender, img, invite_status) {
        this.invite_status = invite_status;
        this.sender = sender;
        this.img = img;
    }
}
ClientInvitation.instance = new ClientInvitation('', '', 'unsent');
// ! res ------------------------------------------------------------------------------------------
// * Pool
export class Play {
    constructor(game) {
        this.game = game;
    }
}
Play.instance = new Play('');
export class Pool {
    constructor(pool) {
        this.pool = pool;
    }
}
Pool.instance = new Pool([]);
export class Invitations {
    constructor(invitations) {
        this.invitations = invitations;
    }
}
Invitations.instance = new Invitations([]);
// * Game
export class Start {
    constructor() {
        this.start = 'START';
    }
}
Start.instance = new Start();
export class Stop {
    constructor() {
        this.stop = 'STOP';
    }
}
Stop.instance = new Stop();
export class Frame {
    constructor(ball, rightPaddle, leftPaddle) {
        this.ballRadius = Math.ceil(ball.radius);
        this.paddleRadius = Math.ceil(rightPaddle.radius);
        this.ballX = Math.ceil(ball.pos.x);
        this.ballY = Math.ceil(ball.pos.y);
        this.rightPaddlePosX = Math.ceil(rightPaddle.pos.x);
        this.rightPaddlePosY = Math.ceil(rightPaddle.pos.y);
        this.leftPaddlePosX = Math.ceil(leftPaddle.pos.x);
        this.leftPaddlePosY = Math.ceil(leftPaddle.pos.y);
        this.paddleHeight = Math.ceil(rightPaddle.length);
    }
}
Frame.instance = new Frame(new Ball({ pos: new Vector(0, 0), radius: 0, velocity: new Vector(0, 0) }), new Paddle({ start: new Vector(0, 0), end: new Vector(0, 0), radius: 0, constrains: new Vector(0, 0) }), new Paddle({ start: new Vector(0, 0), end: new Vector(0, 0), radius: 0, constrains: new Vector(0, 0) }));
export class Score {
    constructor(player, opponent) {
        this.player = player;
        this.opponent = opponent;
    }
}
Score.instance = new Score(0, 0);
export class Lost {
    constructor() {
        this.lost = 'LOST';
    }
}
Lost.instance = new Lost();
export class Won {
    constructor() {
        this.won = 'WON';
    }
}
Won.instance = new Won();
// ! req -------------------------------------------------------------------------
// * Pool
export class Connect {
    constructor(img, page, query) {
        this.query = query;
        this.page = page;
        this.img = img;
    }
}
Connect.instance = new Connect('', '', '');
export class Disconnect {
    constructor(page) {
        this.page = page;
    }
}
Disconnect.instance = new Disconnect('');
export class Invite {
    constructor(recipient) {
        this.recipient = recipient;
    }
}
Invite.instance = new Invite('');
// * Game
export class Hook {
    constructor(up, down) {
        this.up = up;
        this.down = down;
    }
}
Hook.instance = new Hook(false, false);
class WSS {
    constructor() {
        if (WSS.instance)
            return WSS.instance;
        WSS.instance = this;
    }
    // * frame, start, stop, pool, score, won, lost, invitations, error
    // ? Comminication Helpers
    Json({ message, target }) {
        const json = JSON.parse(message);
        const properties = Object.getOwnPropertyNames(json);
        Object.getOwnPropertyNames(target).forEach((property) => {
            if (_.includes(properties, property) === false)
                throw new Error('Invalid JSON');
        });
        return json;
    }
    // ? Protocole Message Builders
    ErrorMessage(username, hash, error) {
        return JSON.stringify(new Message({ username, hash, message: 'ERROR', data: new WSError(error) }));
    }
    // * POOL
    HashMessage(username, hash, img) {
        return JSON.stringify(new Message({ username, hash, message: 'HASH', data: new Hash(username, img, hash) }));
    }
    PlayMessage(username, hash, game) {
        return JSON.stringify(new Message({ username, hash, message: 'PLAY', data: new Play(game) }));
    }
    PoolMessage(username, hash, getClientPlayers) {
        return JSON.stringify(new Message({ username, hash, message: 'POOL', data: new Pool(getClientPlayers()) }));
    }
    InvitationMessage(username, hash, getInvitions) {
        return JSON.stringify(new Message({ username, hash, message: 'INVITATIONS', data: new Invitations(getInvitions()) }));
    }
    // * GAME
    StartMessage(username, hash) {
        return JSON.stringify(new Message({ username, hash, message: 'START', data: new Start() }));
    }
    StopMessage(username, hash) {
        return JSON.stringify(new Message({ username, hash, message: 'STOP', data: new Stop() }));
    }
    FrameMessage(username, hash, frame) {
        return JSON.stringify(new Message({ username, hash, message: 'FRAME', data: frame }));
    }
    ScoreMessage(username, hash, player, opponent) {
        return JSON.stringify(new Message({ username, hash, message: 'SCORE', data: new Score(player, opponent) }));
    }
    LostMessage(username, hash) {
        return JSON.stringify(new Message({ username, hash, message: 'LOST', data: new Lost() }));
    }
    WonMessage(username, hash) {
        return JSON.stringify(new Message({ username, hash, message: 'WON', data: new Won() }));
    }
    /************************************************************************************************************************
     *                                                        PARSER                                                        *
     ************************************************************************************************************************/
    useParser(json, socket) {
        const { username, message, hash, data } = this.Json({ message: json, target: Message.instance });
        // ? connect.page = 'MAIN' | 'GAME';
        console.log(message);
        // } else if (hash !== mdb.getPlayerHash(username)) throw new Error('hash mismatch ' + mdb.getPlayerHash(username) + ' ' + hash);
        switch (message) {
            case 'CONNECT':
                const connect = this.Json({ message: data, target: Connect.instance });
                const player = mdb.createPlayer(username, connect.img, socket);
                switch (connect.page) {
                    case 'MAIN': {
                        mdb.addPlayer(player);
                        break;
                    }
                    case 'GAME': {
                        mdb.connectPlayer(player, connect.query);
                        break;
                    }
                    default:
                        break;
                }
                player.socket.send(WS.HashMessage(player.username, player.socket.hash, player.img));
                break;
            case 'DISCONNECT': {
                const disconnect = this.Json({ message: data, target: Disconnect.instance });
                switch (disconnect.page) {
                    case 'MAIN': {
                        mdb.removePlayer(username);
                        break;
                    }
                    case 'GAME': {
                        mdb.disconnectPlayer(username);
                        break;
                    }
                    default:
                        break;
                }
                break;
            }
            case 'INVITE': {
                const invite = this.Json({ message: data, target: Invite.instance });
                console.log('INVITE', username, invite);
                mdb.createInvitation(username, invite.recipient);
                break;
            }
            case 'ACCEPT': {
                const invite = this.Json({ message: data, target: Invite.instance });
                console.log('ACCEPT', username, invite);
                mdb.acceptInvitation(invite.recipient, username);
                break;
            }
            case 'REJECT': {
                const invite = this.Json({ message: data, target: Invite.instance });
                console.log('REJECT', username, invite);
                mdb.declineInvitation(invite.recipient, username);
                break;
            }
            case 'DELETE': {
                const invite = this.Json({ message: data, target: Invite.instance });
                console.log('DELETE', username, invite);
                if (invite.recipient === '*')
                    mdb.deleteAllRejectedInvitations(username);
                else
                    mdb.deleteRejectedInvitation(invite.recipient, username);
                break;
            }
            case 'HOOK': {
                const h = this.Json({ message: data, target: Hook.instance });
                mdb.roomHook(username, h);
                break;
            }
            default:
                throw new Error('Invalid JSON');
        }
        mdb.updateClient();
    }
    closeSocket(socket) {
        if (socket.username) {
            mdb.removePlayer(socket.username);
            mdb.cancelAllPlayerInvitations(socket.username);
        }
        mdb.updateClient();
    }
    main() {
        setInterval(() => {
            mdb.updateMdb();
            mdb.updateClient();
            mdb.updateRooms();
        }, 1000 / 60);
    }
}
export const WS = new WSS();
export function transformFrame(f, width, height) {
    return {
        ...f,
        ballY: f.ballY,
        ballX: width - f.ballX,
        ballRadius: f.ballRadius,
        paddleHeight: f.paddleHeight,
        paddleRadius: f.paddleRadius,
        leftPaddlePosY: f.leftPaddlePosY,
        rightPaddlePosY: f.rightPaddlePosY,
        leftPaddlePosX: width - f.leftPaddlePosX,
        rightPaddlePosX: width - f.rightPaddlePosX,
    };
}
