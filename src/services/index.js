import fp from "fastify-plugin";
import { UserService } from './UserService.js';
import { AuthService } from './AuthService.js';
// import { FriendService } from './FriendService.js';
// import { ChatService } from './ChatService.js';
// import { GameService } from './GameService.js';

export default fp(async (fastify) => {
    fastify.decorate('userService', new UserService(fastify.userDao));
    fastify.decorate('authService', new AuthService(fastify.authDao));
    // fastify.decorate('friendService', new FriendService(fastify.friendDao));
    // fastify.decorate('chatService', new ChatService(fastify.chatDao));
    // fastify.decorate('gameService', new GameService(fastify.gameDao));
    
});