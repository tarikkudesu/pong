import fp from "fastify-plugin";
import { UserService } from './UserService.js';
import { AuthService } from './AuthService.js';
// import { FriendService } from './FriendService.js';
// import { ChatService } from './ChatService.js';
// import { GameService } from './GameService.js';

export default fp(async (fastify) => {
    /**
     * user service is the most used service to fetch data related to the users
     * so that all services can share the same UserService object
     * */
    const userService = new UserService(fastify.UserRepository);

    
    
    fastify.decorate('userService', userService);
    fastify.decorate('authService', new AuthService(fastify.authRepository, userService));
    // fastify.decorate('friendService', new FriendService(fastify.FriendRepository));
    // fastify.decorate('chatService', new ChatService(fastify.chatDao));
    // fastify.decorate('gameService', new GameService(fastify.gameDao));
    
});