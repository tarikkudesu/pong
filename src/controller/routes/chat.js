export default (fastify) =>
{
    /**
     * logic will be implemented later
     */

    fastify.get('/load/:uid', async (req, rep) => {
        // logic
        return {
            messages: 'load messages'
        };
    });

    fastify.get('/notread/:uid', async (req, rep) => {
        // logic
        return {
            messages: 'messages not read'
        };
    });

    fastify.get('/send', { websocket: true }, (sock, req) => {
        sock.socket.on('message', (message) => {
        
            //logic

            sock.socket.send(`message reçu`)
        });
    })
}
