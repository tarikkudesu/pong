export default (fastify) => {
    
    /**
     * logic will be implemented later
     */

    fastify.post('/signin', async (request, reply) => {    
        try {
            return {
                signin: 'signin',
                token: fastify.authService.generateToken(request.body, "salam kalam 3alam", '60d')
            }
        } catch (error) {
            fastify.log.error(error.msg, error.stack);
            reply.code(400).send({
                message: error.message
            });
        }    
    });
    
    fastify.post('/signup', async (request, reply) => {
        try {
            //logic
            return {
                signin: 'signup',
                token: fastify.authService.generateToken(request.body, "salam kalam 3alam", '60d')
            }
        } catch (error) {
            fastify.log.error(error.msg, error.stack);
            reply.code(400).send({
                message: error.message
            });
        }    
    });
    
    fastify.post('/logout', async (request, reply) => {        
            try {
                //logic
                return { logout: 'logout' }
            } catch (error) {
                fastify.log.error(error.msg, error.stack);
                reply.code(400).send({
                    message: error.message
                });
            }    
    });
}
