import fp from "fastify-plugin";
import { UserService } from './UserService.js';
// import { AuthService } from './AuthService.js';
// import { FriendService } from './FriendService.js';

export default fp(async (fastify) => {
    fastify.decorate('userService', new UserService(fastify.userDao));
    // fastify.decorate('authService', new AuthService(fastify.authDao));
    // fastify.decorate('friendService', new FriendService(fastify.friendDao));
});