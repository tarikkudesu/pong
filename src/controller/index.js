//main controller plugins
export default async (fastify) => {
    /**
     * decorators
     */
    fastify.decorate('status_code', (await import('http')).STATUS_CODES)

    
    /**
     * hooks
     */
    fastify.register(await import('./hooks/middleware.js'));
    

    /**
     * routes
     */
    fastify.register(await import('./routes/user.js'), {prefix: '/api/user'});
    fastify.register(await import('./routes/auth.js'), {prefix: '/api/auth'});
    fastify.register(await import('./routes/oauth.js'), {prefix: '/api/oauth'});
    fastify.register(await import('./routes/friend.js'), {prefix: '/api/friend'});
    fastify.register(await import('./routes/chat.js'), {prefix: '/api/chat'});
}
