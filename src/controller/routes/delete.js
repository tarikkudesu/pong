export default (fastify) => {
    fastify.get('/', async (req, rep) => {
        await fastify.userdao.deleteUser(req.params.id);
        return {
            status: 'deleted successfuly',
        };
    })
}