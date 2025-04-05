export default function (fastify, opts) {
    fastify.get('/', async (request, reply) => {
        const fetchedUsers = await fastify.userdao.getUsers();
        return {users: fetchedUsers}
    })
}