
//main router plugin
export default async (fastify) => {

    /**
     * here should be the business layer instance 
     * that communicate with routers
     * so dao is just temp wiring !!!
     */ 
    fastify.register(await import('../dao/index.js'));

    /**
     * routes
     */
    fastify.register(await import('./get-all.js'), {prefix: '/users'});
    fastify.register(await import('./add.js'), {prefix: '/adduser'});
    // fastify.register(await import('./get-one.js'), {prefix: '/user/:id'});
    // fastify.register(await import('./update.js'), {prefix: '/update/:id'});
    // fastify.register(await import('./delete.js'), {prefix: '/delete/:id'});
}
