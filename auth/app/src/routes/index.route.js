import { AuthController } from '../controllers/AuthController.js';
import { OAuthController } from '../controllers/OAuthController.js';
import fp from 'fastify-plugin'
// import * as schemas from '../schemas/auth.js'

export default (fastify) => {

    const authController = new AuthController(fastify.authService);
    const oauthController = new OAuthController(fastify.authService);

    fastify.post('/refresh', authController.refreshToken);

    fastify.get('/signin', authController.signin);
    // fastify.post('/signin', authController.signin);

    fastify.post('/signup', authController.signup)

    fastify.post('/logout', authController.logout);

    fastify.post('/password/get-otp', authController.getOtp);

    fastify.post('/password/verify-otp', authController.verifyOtp);
        
    fastify.get('/google', oauthController.googleOauth);
        
    fastify.get('/google/callback', oauthController.googleCallbackOauth)

    fastify.options('*', authController.preflight);
}
