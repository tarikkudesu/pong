import fp from "fastify-plugin";
import cookie from 'cookie';

export default fp(async (fastify) =>
{
    fastify.addHook('preHandler', async (request, reply) => {
        const baseUrl = 'http://' + (process.env.SERVER_HOST || 'localhost');
        if (!fastify.authService.shouldAuthenticate(new URL(request.url, baseUrl)))
            return ;
        const cookies = cookie.parse(request.headers['cookie'] || '');
        let status = await fastify.authService.validToken(cookies.token)
        if (status >= 400)
            return reply.code(status).send({message: fastify.status_code[status]});
    });
})
