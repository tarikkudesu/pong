import Fastify from 'fastify'
import env from 'dotenv'
import path from 'path'

class Server {
    constructor(logger) {        
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
        this.fastify.register(await import('./dao/index.js'));
        this.fastify.register(await import('./services/index.js'));
        this.fastify.register(await import('./controller/index.js'));
    }

    async startHttpServer()
    {
        this.fastify.listen({
            port : process.env.PORT || 3000,
            host: process.env.HOST || '127.0.0.1', 
        });
    }
    
    async main()
    {
        /**
         * load the environnement vars from .env
         */
        env.config({ path: path.resolve('ressources/credentials/.env') });

        await this.registerPlugins();
        await this.startHttpServer();
    }
}

const logger  =  {
    transport : {
        target : 'pino-pretty'
    }
}

// new Server(logger).main()
// new Server(true).main()
new Server(false).main()

/**
 * to test this component, you can install VSCode `REST Client` tool 
 * and use the endpoints exist in `test.http` file in the root of the project  
 * NB : for POST and put requests, make sure to implement a body request that match the src/controller/schemas/*
 */
