import { Server } from './src/server.js'

function main() {
    const logger  =  {
        transport : {
            target : 'pino-pretty'
        }
    }

    new Server(logger).start()
    // new Server(true).start()
    // new Server(false).start()
}

main()

/**
 * to test this component, you can install VSCode `REST Client` tool 
 * and use the endpoints exist in `test.http` file in the root of the project  
 * NB : for POST and put requests, make sure to implement a body request that match the src/controller/schemas/*
 */