import fp from "fastify-plugin";
import { parse } from 'url';

export default fp(async (fastify) =>
{
    fastify.addHook('preHandler', async (request, reply) => {
        const baseUrl = 'http://' + (process.env.SERVER_HOST || 'localhost');
        if (!fastify.authService.shouldAuthenticate(new URL(request.url, baseUrl)))
            return ;
        let status = await fastify.authService.validToken(request.headers['authorization'])
        if (status >= 400)
            return reply.code(status).send({message: fastify.status_code[status]});
    });
})
