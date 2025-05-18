import Fastify from 'fastify'
import env from 'dotenv'

class Server {
    constructor(logger = true) {        
        /**
         * fastify instance
         */
        this.fastify =  Fastify({ logger });
    }

    async registerPlugins()
    {
        /**
         * the order of the layers is important, due to its architecture nature.
         * dao layer used by service leyer which is used by the controller
         */
        this.fastify.register(await import('@fastify/websocket'));
		this.fastify.register(await import('@fastify/cors'), { origin: '*' });
          
        this.fastify.register(await import('./dao/index.js'));
        this.fastify.register(await import('./services/index.js'));
        this.fastify.register(await import('./controller/index.js'));
    }

    async listen()
    {
        this.fastify.listen({
            port : process.env.SERVER_PORT || 3000,
            host: process.env.SERVER_HOST || '0.0.0.0', 
        });
    }

    async start()
    {
        /**
         * load the environnement vars from .env
         */
        env.config({ path: './.env' });

        await this.registerPlugins();
        await this.listen();
    }
}

export { Server };

