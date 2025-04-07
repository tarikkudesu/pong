export default (fastify) => {
    fastify.get('/', async (request, reply) => {
        const fetchedUsers = await fastify.userdao.getUsers();
        return {
            users: fetchedUsers
        }
    })
}