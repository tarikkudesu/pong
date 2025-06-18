import cookie from 'cookie';
import fp from 'fastify-plugin'

export default fp(async (fastify) =>
{
    fastify.addHook('preHandler', async (request, reply) => {        
        const baseUrl = 'http://' + (process.env.SERVER_HOST || 'localhost');
        
        if (!fastify.authService.shouldAuthenticate(new URL(request.url, baseUrl)))
            return ;
                const cookies = cookie.parse(request.headers['cookie'] || '');
        let stat = await fastify.authService.validToken(cookies.token)
        if (!stat.stat)
            return reply.code(403).send({message: "should Authenticate"});
    });
})
