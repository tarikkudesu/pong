export const signin = async (request, reply) => {
    const response = await request.fastify.authService.canSignIn(request.body)      
    if (response.stat)
    {
        const token = request.fastify.authService.generateToken(request.body, process.env.JWT_SECRET || "salam kalam 3alam", '60d');
        return reply.header('Set-Cookie', `token=${token}; Max-Age=5184000`)
                    .send({message: 'logged successfuly'});
    }
    return reply.code(400).send({ error : response.message });
}

export const refreshToken = async (request, reply) => {
    const response = await request.fastify.authService.refreshToken(request.body)  
    if (response.stat)
        return reply.send({ token: response.token });
    return reply.code(400).send({ error : response.message });
}

export const signup = async (request, reply) => {
    const response = await request.fastify.authService.canSignUp(request.body)
    if (response.stat)
    {
        const token = request.fastify.authService.generateToken(request.body, process.env.JWT_SECRET || "salam kalam 3alam", '60d'); 
        return reply.header('Set-Cookie', `token=${token}; Max-Age=5184000`)
                    .send({data: "ok"});
    }
    return reply.code(400).send({ error: response.message }) //?? code ??
}


export const logout = async (request, reply) => {        
    return reply.header('Set-Cookie', 'token=; Max-Age=0')
        .send({ data: 'logout' });
};

export const getOtp = async (request, reply) => {
    const response = { stat: true };  // success test unit
    // const response = { stat: false, message: 'fail use case test' }; 
    // const response = await request.fastify.authService.sendOTP(request.body); // prod instruction
    if (response.stat)
        return reply.send({ 
            status: "otp sent",
            email: request.body.email 
        });
    return reply.code(400).send({ error: response.message });
}

export const verifyOtp = async (request, reply) => {
    const response = await request.fastify.authService.validOtp(request.body)
    if (response.stat)
        return reply.send({data: "temporary otp validion"})
    return reply.code(400).send({ error: response.message})
}

export const preflight = async (request, reply) => {
    const allowedOrigins = process.env.ALLOWED_ORIGIN
        ? process.env.ALLOWED_ORIGIN.split(',').map(o => o.trim())
        : [];

    const origin = request.headers.origin;

    if (!origin || !allowedOrigins.includes(origin))
        return reply.code(403).send({ 
            error: 'Origin not allowed by CORS policy'
        });

    return reply
            .header('Access-Control-Allow-Origin', origin)
            .header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
            .header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
