import {signinSchema, signupSchema, logoutSchema} from '../schemas/auth.js'

export default (fastify) => {
    
    /**
     * logic will be implemented later
     */

    fastify.post('/signin', { schema: signinSchema }, async (request, reply) => {   
        if (await fastify.authService.canSignIn(request.body))
        {
            const token = fastify.authService.generateToken(request.body, process.env.TOKEN_SECRET || "salam kalam 3alam", '60d');
            return reply.header('Set-Cookie', `token=${token}; Max-Age=5184000`)
                        .send({message: 'logged successfuly'});
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
                return reply.header('Set-Cookie', `token=${token}; Max-Age=5184000`);
            }
            throw check.error;
        } catch (error) {
            return reply.code(400).send({ error }) //?? code ??
        }
    })

    fastify.post('/logout', { schema: logoutSchema }, async (request, reply) => {        
        return reply.header('Set-Cookie', 'token=; Max-Age=0')
                    .send({ message: 'logout' });
    });

    fastify.post('/password/get-otp', async (request, reply) => {
        try {
            await fastify.authService.sendOTP(request.body);
            return reply.send({
                status: "top sent",
                email: request.body.email
            });
        }
        catch (error)
        {
            return reply.code(400).send({ error })
        }
    })

    fastify.post('/password/validate-otp', async (request, reply) => {
        if (await fastify.authService.validOtp(request.body))
            return reply.code(200).send({status: "valid otp"})
        return reply.code(400).send({status: "not a valid otp"})
    })
}
