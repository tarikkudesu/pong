
export default async (fastify) => {

    fastify.decorate('status_code', (await import('http')).STATUS_CODES)

    fastify.register(await import('./user.js'), {prefix: '/api/user'});
    fastify.register(await import('./auth.js'), {prefix: '/api/auth'});
    fastify.register(await import('./oauth.js'), {prefix: '/api/oauth'});
    // fastify.register(await import('../routes/friend.js'), {prefix: '/api/friend'});
    // fastify.register(await import('../routes/chat.js'), {prefix: '/api/chat'});
}
