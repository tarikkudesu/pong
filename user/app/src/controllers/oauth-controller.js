export const googleOauth =  async (request, reply) => {    
    const queryParams = {
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: 'http://localhost:3000/api/oauth/google/callback',
        response_type: 'code',
        scope: 'openid email profile',
    };

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams(queryParams).toString()}`;
    reply.redirect(url);
}

export const googleCallbackOauth =  async (request, reply) => {
    if (!request.query.code)
        return reply.code(400).send('Missing "code" from Google');
    try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                code: request.query.code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: 'http://localhost:3000/api/oauth/google/callback',
                grant_type: 'authorization_code'
            }).toString()
        });

        const tokenData = await tokenRes.json();

        if (!tokenData.access_token)
            throw new Error('No access token received');

        const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        });
        const user = await userRes.json();
        const formatedUser = {
            username: user.name,
            email: user.email,
            pass: '',
            avatar: user.picture
        };
        await request.fastify.userService.addUser(formatedUser)
        return reply.header('Content-Type', 'text/html').send(`
            <h2>Welcome, ${user.name}!</h2>
            <p>Email: ${user.email}</p>
            <img src="${user.picture}" style="border-radius:50%" />
        `);
    } catch (err) {
        console.error('OAuth callback error:', err);
        reply.code(500).send('Error during OAuth process');
    }
}