import fp from "fastify-plugin";

export default fp(async (fastify) => {

    fastify.addHook('preSerialization', async (request, reply, payload) => {
        reply.header('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
        return payload;
    });
})
