import Fastify from 'fastify'
import env from 'dotenv'

class Server {
    constructor(logger = true) {        
        /**
         * fastify instance
         */
        this.fastify =  Fastify({ logger });
    }

    registerPlugins()
    {
        /**
         * the order of the layers is important, due to its architecture nature.
         * dao layer used by service leyer which is used by the controller
         */

        this.fastify.register(import('./hooks/index.js'));
        this.fastify.register(import('./repositories/index.js'));
        this.fastify.register(import('./services/index.js'));
        this.fastify.register(import('./routes/index.js'));
    }

    listen()
    {
        this.fastify.listen({
            port : process.env.SERVER_PORT || 3000,
            host: process.env.SERVER_HOST || '127.0.0.1', 
        });
    }

    start()
    {
        /**
         * load the environnement vars from .env
         */
        env.config({ path: './.env' });

        this.registerPlugins();
        this.listen();
    }
}

export { Server };

