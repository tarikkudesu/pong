

export default (fastify) => {
    fastify.get('/google', async (request, reply) => {
        console.log('salam');
    
        const queryParams = {
            client_id: process.env.GOOGLE_CLIENT_ID,
            redirect_uri: 'http://localhost:3000/api/oauth/google/callback',
            response_type: 'code',
            scope: 'openid email profile',
        };
    
        const url = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams(queryParams).toString()}`;
        reply.redirect(url);
    });

    fastify.get('/google/callback', async (request, reply) => {
        console.log(request);
        reply.header('Content-Type', 'text/html').send("<h1 style='text-align:center'>setting up google OAuth successfuly</h1>")
    })
}