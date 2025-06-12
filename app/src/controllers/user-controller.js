

export const updateUser = async (request, reply) => {
    let response = await request.fastify.userService.updateUser(request.body)
    if (response.stat)
        return reply.code(201).send({ user:  request.body.data });
    return reply.code(400).send({ error: response.message });
}

export const getUsers =  async (request, reply) => {    
    const response = await request.fastify.userService.getUsers();
    if (response.stat)
        return reply.send({ data: response.users });
    return reply.code(400).send({ error: response.message });
}

export const filterUser = async (request, reply) => {
    const response = await request.fastify.userService.getUser(request.body.filter, ...request.body.fields);
    if (response.stat)
        return reply.send({ data: response.user });
    return reply.code(400).send({ error: response.message });
}

export const deleteUser = async (request, reply) => {
    let response = await request.fastify.userService.deleteUser(request.body.filter);
    if (response.stat)
        return reply.send({ data: 'deleted successfuly' });
    return reply.send({ error: response.message });
}

export const graphqlUser = async (request, reply) => {
    const response = await request.fastify.userService.getUsers(request.body.filter, ...request.body.fields);
    if (response.stat)
        return reply.send({ data: response.users });
    return reply.code(400).send({ error: response.message });
}