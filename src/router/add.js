
const schema = {
    body : {
        type : 'object',
        properties : {
            id: {type : 'number'},
            name: {type : 'string'},
            bio: {type : 'string'},
        },
        required : ['id', 'name', 'bio']
    }
}

export default function (fastify, opts) {
    fastify.post('/', schema, async (request, reply) => {        
        fastify.userdao.addUser(request.body.body);
        return {response: request.body};
    });
}