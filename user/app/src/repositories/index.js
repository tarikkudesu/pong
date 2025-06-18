import fp from 'fastify-plugin';
import { UserRepository } from './UserRepository.js';
import ORM from './orm.js';
// import { AuthDAO } from './AuthDAO.js';
// import { FriendRepository } from './FriendRepository.js';
// import { ChatDAO } from './ChatDAO.js';
// import { GameDAO } from './GameDAO.js';

export default fp(async (fastify) => {
    fastify.addHook('onClose', () => {
        ORM.close();
    });
    const orm = await ORM.getORMInstance();
    fastify.decorate('UserRepository', new UserRepository(orm));
    // fastify.decorate('authDao', new AuthDAO(db));
    // fastify.decorate('FriendRepository', new FriendRepository(db));
    // fastify.decorate('chatDao', new ChatDAO(db));
    // fastify.decorate('gameDao', new GameDAO(db));
});
