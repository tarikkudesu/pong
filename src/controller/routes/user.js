// import schema from '../schemas/response.js'

export default (fastify) => {

    /**
     * middelwares will be implemented later
     */
    
    fastify.post('/update', async (request, reply) => {
        let response = await fastify.userService.updateUser(request.body)
        if (response.stat)
            reply.code(201).send({ user:  request.body.data });
        reply.code(400).send({ error: error.message });
    });
    
    fastify.get('/', async (request, reply) => {
        const response = await fastify.userService.getUsers();
        if (response.stat)
            reply.send({ data: response.users });
        reply.code(400).send({ error: response.message });
    });
    
    fastify.get('/:username', async (request, reply) => {
        const response = await fastify.userService.getUser(req.params.username);
        if (response.stat)
            return reply.send({ data: response.user });
        reply.code(400).send({ error: response.message });
    })
    
    fastify.delete('/:username', async (request, reply) => {
        let response = await fastify.userService.deleteUser(req.params.username);
        if (response.stat)
            reply.send({ data: 'deleted successfuly' });
        reply.send({ error: response.message });
    });
}
