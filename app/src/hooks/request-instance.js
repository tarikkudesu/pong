import fp from 'fastify-plugin'

export default fp(async (fastify) => {
    
    fastify.addHook('onRequest', async (request, reply) => {
        request.fastify = fastify;
    });
});