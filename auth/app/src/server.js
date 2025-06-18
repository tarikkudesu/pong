import Fastify from 'fastify'
import env from 'dotenv'
import { AuthService } from './services/AuthService.js';
import { UserService } from './services/UserService.js';
import routes from './routes/index.js'

class Server
{
    constructor(logger = true)
    {
        this.fastify =  Fastify({ logger });
    }

    registerPlugins()
    {
        this.fastify.decorate('authService', new AuthService(new UserService()));  
        this.fastify.register(routes);
    }

    async listen()
    {
        this.fastify.listen({
            port : process.env.SERVER_PORT || 3000,
            host: process.env.SERVER_HOST || '127.0.0.1', 
        });
    }

    async start()
    {
        /**
         * load the environnement vars from .env
         */
        env.config({ path: './.env' });

        this.registerPlugins();
        await this.listen();
    }
}

export { Server };

