import fp from "fastify-plugin";

export default fp(async (fastify) => {
    fastify.setErrorHandler((error, request, reply) => {
        if (error.validation) {
            reply.send({
                error: 'Invalid input',
                issues: error.validation.map(v => ({
                    field: v.instancePath,
                    message: v.message,
                }))
            });
        } else {
            reply.status(error.statusCode || 500).send({
                error: error.message || 'Something went wrong'
            });
        }
    });
});
