import fp from 'fastify-plugin'
import { UserDAO } from './UserDAO.js';

export default fp(async (fastify) => {
    const userdao = new UserDAO(fastify.sqlite);
    fastify.decorate('userdao', userdao);
})