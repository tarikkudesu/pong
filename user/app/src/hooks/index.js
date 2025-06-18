import fp from "fastify-plugin";

export default fp(async (fastify) => {

    fastify.register(await import('./auth-hook.js'));
    fastify.register(await import('./cors-hook.js'));
    fastify.register(await import('./request-instance.js'));

})