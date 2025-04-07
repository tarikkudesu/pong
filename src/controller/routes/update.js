import schema from '../schemas/post.js'


export default (fastify) => {
    fastify.post('/', schema, async (request, reply) => {        
        await fastify.userdao.updateUser(req.params.id, request.body.body);
        return {
            response: request.body
        };
    });
}
