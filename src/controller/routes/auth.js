import {signinSchema, signupSchema, logoutSchema} from '../schemas/auth.js'

export default (fastify) => {
    
    /**
     * logic will be implemented later
     */

    fastify.post('/signin', { schema: signinSchema }, async (request, reply) => {    
        if (await fastify.userService.userExist(request.body))
        {
            const token = fastify.authService.generateToken(request.body, process.env.TOKEN_SECRET || "salam kalam 3alam", '60d');
            return {
                signin: 'signin', // to remove
                token
            };
        }
        return reply.code(400).send({
            error: 'username or pass is wrrong'
        });
    });
    
    fastify.post('/signup', { schema: signupSchema }, async (request, reply) => {
        if (await fastify.userService.addUser(request.body))
        {
            const token = fastify.authService.generateToken(request.body, process.env.TOKEN_SECRET || "salam kalam 3alam", '60d'); 
            return {
                signin: 'signup', // to remove
                token
            }
        }
        return reply.code(400).send({ // ?? code ??
            error: 'cannot signup  user'
        });
    })

    fastify.post('/logout', { schema: logoutSchema }, async (request, reply) => {        
        //destroy the JWT
        return { logout: 'logout' }
    });
}
