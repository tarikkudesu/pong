import * as schemas from '../schemas/auth.js'
import * as authController from '../controllers/auth-controller.js'

export default (fastify) => {

    fastify.post('/signin', { schema: schemas.signinSchema }, authController.signin);

    fastify.post('/signup', { schema: schemas.signupSchema }, authController.signup)

    fastify.post('/logout', { schema: schemas.logoutSchema }, authController.logout);
        
    fastify.post('/password/get-otp', authController.getOtp);

    fastify.post('/password/verify-otp', authController.verifyOtp);

    fastify.options('*', authController.preflight);
}
