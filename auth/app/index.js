import { Server } from './src/server.js'

function main() {
    const logger  =  {
        transport : {
            target : 'pino-pretty'
        }
    }

    new Server(logger).start()
    // new Server(flase).start()
    // new Server().start()
}

main()
