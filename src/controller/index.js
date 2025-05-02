//main controller plugins
export default async (fastify) => {
    /**
     * parsers
     */
    fastify.register(await import('./parsers/x-www-form-urlencoded.js'))

    /**
     * decorators
     */
    fastify.decorate('status_code', (await import('http')).STATUS_CODES)

    
    /**
     * middlewares
     */
    fastify.register(await import('./hooks/auth-hook.js'));
    fastify.register(await import('./hooks/cors-hook.js'));
    fastify.register(await import('./schemas/bad-schema.js'));
    

    /**
     * routes
     */
    fastify.register(await import('./routes/user.js'), {prefix: '/api/user'});
    fastify.register(await import('./routes/auth.js'), {prefix: '/api/auth'});
    fastify.register(await import('./routes/oauth.js'), {prefix: '/api/oauth'});
    fastify.register(await import('./routes/friend.js'), {prefix: '/api/friend'});
    fastify.register(await import('./routes/chat.js'), {prefix: '/api/chat'});
}
