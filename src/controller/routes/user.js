// import schema from '../schemas/response.js'

export default (fastify) => {

    /**
     * middelwares will be implemented later
     */
    
    fastify.post('/update', async (request, reply) => {
        let response = await fastify.userService.updateUser(request.body)
        if (response.stat)
            return reply.code(201).send({ user:  request.body.data });
        return reply.code(400).send({ error: response.message });
    });
    
    fastify.get('/', async (request, reply) => {
        
        const response = await fastify.userService.getUsers();
        if (response.stat)
            return reply.send({ data: response.users });
        return reply.code(400).send({ error: response.message });
    });
    
    fastify.post('/filter', async (request, reply) => {
        const response = await fastify.userService.getUser(request.body.filter, ...request.body.fields);
        if (response.stat)
            return reply.send({ data: response.user });
        return reply.code(400).send({ error: response.message });
    })
    
    fastify.post('/delete', async (request, reply) => {
        let response = await fastify.userService.deleteUser(request.body.filter);
        if (response.stat)
            return reply.send({ data: 'deleted successfuly' });
        return reply.send({ error: response.message });
    });

    fastify.post('/graphql', async (request, reply) => {
        const response = await fastify.userService.getUsers(request.body.filter, ...request.body.fields);
        console.log(response);
        if (response.stat)
            return reply.send({ data: response.users });
        return reply.code(400).send({ error: response.message });
    });
}
