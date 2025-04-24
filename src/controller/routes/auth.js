import {signinSchema, signupSchema, logoutSchema} from '../schemas/auth.js'

export default (fastify) => {
    
    /**
     * logic will be implemented later
     */

    fastify.post('/signin', { schema: signinSchema }, async (request, reply) => {   
        if (await fastify.authService.canSignIn(request.body))
        {
            const token = fastify.authService.generateToken(request.body, process.env.TOKEN_SECRET || "salam kalam 3alam", '60d');
            return { token };
        }
        return reply.code(400).send({
            error: 'username or password is wrrong'
        });
    });

    fastify.post('/signup', { schema: signupSchema }, async (request, reply) => {
        try {
            let check = await fastify.authService.canSignUp(request.body)
            if (check.status)
            {
                await fastify.userService.addUser(request.body)
                const token = fastify.authService.generateToken(request.body, process.env.TOKEN_SECRET || "salam kalam 3alam", '60d'); 
                return { token };
            }
            throw check.error;
        } catch (error) {
            return reply.code(400).send({ error }) //?? code ??
        }
    })

    fastify.post('/logout', { schema: logoutSchema }, async (request, reply) => {        
        //destroy the JWT
        return reply.code(200).send({
            message: 'logout success'
        });
    });
}
