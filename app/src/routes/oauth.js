import * as oauth from '../controllers/oauth-controller.js'

export default (fastify) => {
    fastify.get('/google', oauth.googleOauth);
    fastify.get('/google/callback', oauth.googleCallbackOauth)
}