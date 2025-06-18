import Fastify from 'fastify'
import env from 'dotenv'
import { AuthService } from './services/AuthService.js';
import { UserService } from './services/UserService.js';

class Server
{
    constructor(logger = true)
    {
        this.fastify =  Fastify({ logger });
    }

    registerPlugins()
    {
        this.fastify.decorate('authService', new AuthService(new UserService()));  
        this.fastify.register(import('./routes/index.route.js'), { prefix: '/auth' });
    }

    listen()
    {
        this.fastify.listen({
            port : process.env.SERVER_PORT || 3001,
            host: process.env.SERVER_HOST || '127.0.0.1', 
        });
    }

    async start()
    {
        env.config({ path: './.env' });

        this.registerPlugins();
        // await this.fastify.ready();
        // console.log(this.fastify.printRoutes());
        this.listen();
    }
}

export { Server };

