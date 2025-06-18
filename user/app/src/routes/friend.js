import * as friendController from '../controllers/friend-controller.js'

export default (fastify) =>
{
    /**
     * uid: user id
     * fid: friend id
     * logic will be implemented later
     */

    fastify.get('/add/:uid/:fid', friendController.addFriend);

    fastify.get('/accept/:uid/:fid', friendController.acceptFriend);
    
    fastify.get('/remove/:uid/:fid', friendController.removeFriend);
    
    fastify.get('/block/:uid/:fid', friendController.blockFriend);
}
