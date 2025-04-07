import schema from '../schemas/post.js' // VS decorator in parent context scope


export default (fastify) => {
    fastify.post('/', schema, async (request, reply) => {        
        await fastify.userdao.addUser(request.body.body);
        return {
            response: request.body
        };
    });
}