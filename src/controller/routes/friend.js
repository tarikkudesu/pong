export default (fastify) =>
{
    /**
     * uid: user id
     * fid: friend id
     * logic will be implemented later
     */

    fastify.get('/add/:uid/:fid', async (request, reply) => {
        // logic
        return {
            friend: 'add friend'
        };
    });

    fastify.get('/accept/:uid/:fid', async (request, reply) => {
        // logic
        return {
            friend: 'accpted friend'
        };
    });
    
    fastify.get('/remove/:uid/:fid', async (request, reply) => {
        // logic
        return {
            friend: 'delete friend'
        };
    });
    
    fastify.get('/block/:uid/:fid', async (request, reply) => {
        // logic
        return {
            friend: 'block friend'
        };
    })
}
