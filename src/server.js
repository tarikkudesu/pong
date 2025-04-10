import Fastify from 'fastify'
import env from 'dotenv'

/**
 * load the environnement vars from .env
 */
env.config();

/**
 * fastify instance
 */

const fastify = Fastify({
    logger : {
        transport : {
            target : 'pino-pretty'
        }
    }
});

/**
 * the order of the layers is important, due to its architecture nature.
 * dao layer used by service leyer which is used by the controller
 */

fastify.register(await import('./dao/index.js'));
fastify.register(await import('./service/index.js'));
fastify.register(await import('./controller/index.js'));

fastify.listen({
    port : process.env.PORT || 3000,
    host: process.env.HOST || '127.0.0.1',      
});

/**
 * to test this component, you can install VSCode `REST Client` tool 
 * and use the endpoints exist in `test.http` file in the root of the project  
 * NB : for POST and put requests, make sure to implement a body request that match the src/controller/schemas/*
 */
