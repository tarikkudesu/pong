import {signinSchema, signupSchema, logoutSchema} from '../schemas/auth.js'

export default (fastify) => {

    fastify.post('/signin', { schema: signinSchema }, async (request, reply) => {
        const response = await fastify.authService.canSignIn(request.body)  
        if (response.stat)
        {
            const token = fastify.authService.generateToken(request.body, process.env.JWT_TOKEN_SECRET || "salam kalam 3alam", '60d');
            return reply.header('Set-Cookie', `token=${token}; Max-Age=5184000`)
                        .send({message: 'logged successfuly'});
        }
        return reply.code(400).send({ error : response.message });
    });

    fastify.post('/signup', { schema: signupSchema }, async (request, reply) => {
        const response = await fastify.authService.canSignUp(request.body)
        if (response.stat)
        {
            const token = fastify.authService.generateToken(request.body, process.env.JWT_TOKEN_SECRET || "salam kalam 3alam", '60d'); 
            return reply.header('Set-Cookie', `token=${token}; Max-Age=5184000`)
                        .send({data: "ok"});
        }
        return reply.code(400).send({ error: response.message }) //?? code ??
    })

    fastify.post('/logout', { schema: logoutSchema }, async (request, reply) => {        
        return reply.header('Set-Cookie', 'token=; Max-Age=0')
            .send({ data: 'logout' });
    });
        
    fastify.post('/password/get-otp', async (request, reply) => {
        const response = { stat: true };  // success test unit
        // const response = { stat: false, message: 'fail use case test' }; 
        // const response = await fastify.authService.sendOTP(request.body); // prod instruction
        if (response.stat)
            return reply.send({ 
                status: "otp sent",
                email: request.body.email 
            });

        return reply.code(400).send({ error: response.message });
    });

    fastify.post('/password/verify-otp', async (request, reply) => {
        const response = await fastify.authService.validOtp(request.body)
        if (response.stat)
            return reply.send({data: "temporary otp validion"})
        return reply.code(400).send({ error: response.message})
    });

    fastify.options('*', async (request, reply) => {
        return reply.header('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*')
            .header('Access-Control-Allow-Headers', 'Content-Type')
            .send();
    });
}
