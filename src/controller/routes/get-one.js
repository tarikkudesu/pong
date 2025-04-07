export default (fastify) => {
    fastify.get('/', async (req, rep) => {
        const user = await fastify.userdao.getUser(req.params.id);
        return {
            'user' : user
        }
    })
}