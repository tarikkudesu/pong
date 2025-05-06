import fp from 'fastify-plugin';
import { UserDAO } from './UserDAO.js';
import ORM from './orm.js';
// import { AuthDAO } from './AuthDAO.js';
// import { FriendDAO } from './FriendDAO.js';
// import { ChatDAO } from './ChatDAO.js';
// import { GameDAO } from './GameDAO.js';

export default fp(async (fastify) => {
    fastify.addHook('onClose', () => {
        ORM.close();
    });
    const orm = await ORM.getORMInstance();
    fastify.decorate('userDao', new UserDAO(orm));
    // fastify.decorate('authDao', new AuthDAO(db));
    // fastify.decorate('friendDao', new FriendDAO(db));
    // fastify.decorate('chatDao', new ChatDAO(db));
    // fastify.decorate('gameDao', new GameDAO(db));
});
