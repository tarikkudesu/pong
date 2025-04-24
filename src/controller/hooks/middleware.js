import fp from "fastify-plugin";

export default fp(async (fastify) =>
{
    fastify.addHook('preHandler', async (request, reply) => {    
        if (!fastify.authService.shouldAuthenticate(request.url))
            return ;
        let status = await fastify.authService.validToken(request.headers['authorization'])
        if (status >= 400)
            return reply.code(status).send({message: fastify.status_code[status]});
    });
})
