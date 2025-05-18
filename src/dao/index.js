import fp from 'fastify-plugin';
import db  from '../database/index.js';
import { UserDAO } from './UserDAO.js';
// import { AuthDAO } from './AuthDAO.js';
// import { FriendDAO } from './FriendDAO.js';
// import { ChatDAO } from './ChatDAO.js';
import { GameDAO } from './GameDAO.js';

export default fp(async (fastify) => {
    fastify.addHook('onClose', () => {
        db.close();
    });
    fastify.decorate('userDao', new UserDAO(db));
    // fastify.decorate('authDao', new AuthDAO(db));
    // fastify.decorate('friendDao', new FriendDAO(db));
    // fastify.decorate('chatDao', new ChatDAO(db));
    fastify.decorate('gameDao', new GameDAO(db));
});
