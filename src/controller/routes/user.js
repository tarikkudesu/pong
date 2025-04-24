// import schema from '../schemas/response.js'

export default (fastify) => {

    /**
     * middelwares will be implemented later
     */
    
    fastify.post('/update', async (request, reply) => {
        try {
            await fastify.userService.updateUser(request.body);
            return reply.code(201).send({
                user:  request.body.data
            });
        } catch (error) {
            reply.code(400).send({
                message: error.message
            });
        }
    });
    
    fastify.get('/', async (request, reply) => {
        const users = await fastify.userService.getUsers();
        return { users };
    });
    
    fastify.get('/:username', async (req, rep) => {
        const user = await fastify.userService.getUser(req.params.username);
        return { user };
    })
    
    fastify.delete('/:username', async (req, rep) => {
        await fastify.userService.deleteUser(req.params.username);
        return {
            status: 'deleted successfuly',
        };
    });

}
