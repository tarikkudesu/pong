
//main router plugin
export default async (fastify) => {

    /**
     * here should be the business layer instance 
     * that communicate with controller
     * so dao is just temp wiring !!!
     */ 
    fastify.register(await import('../dao/index.js'));


    /**
     * decorator
     */
    // fastify.decorate('postSchema', await import('./schemas/post.js'))

    /**
     * routes
     */

    fastify.register(await import('./routes/get-all.js'), {prefix: '/users'});
    fastify.register(await import('./routes/add.js'), {prefix: '/adduser'});
    fastify.register(await import('./routes/update.js'), {prefix: '/update/:id'});
    fastify.register(await import('./routes/delete.js'), {prefix: '/delete/:id'});
    fastify.register(await import('./routes/get-one.js'), {prefix: '/user/:id'});
}
