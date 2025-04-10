//main controller plugins
export default async (fastify) => {
    /**
     * hooks
     */
    // fastify.register(await import('./hooks/.js'));

    /**
     * routes
     */
    fastify.register(await import('./routes/user.js'), {prefix: '/user'});
    fastify.register(await import('./routes/auth.js'), {prefix: '/auth'});
    fastify.register(await import('./routes/friend.js'), {prefix: '/friend'});
}
