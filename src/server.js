import Fastify from 'fastify'
import env from 'dotenv'

env.config();
const fastify = Fastify({
    logger : {
        transport : {
            target : 'pino-pretty'
        }
    }
});

fastify.register(await import('./database/SQLite.js'));
fastify.register(await import('./router/index.js'));
// fastify.register(await import('./business/index.js'));

let server = async () => {
    await fastify.listen({
        port : process.env.PORT || 3000,
        host: process.env.HOST || '127.0.0.1',        
    })
}

server();
