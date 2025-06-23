import { eventEntry, closeSocket, main } from './game/dist/index.js';

export const pong = async (request, reply) => {
	return reply.code(200).send({ message: 'in' });
};

export default async (fastify) => {
	main();
	fastify.get('/ws/ping', pong);
	fastify.get('/ws', { websocket: true }, (connection, req) => {
		connection.on('message', (message) => eventEntry(message.toString(), connection));
		connection.on('close', () => closeSocket(connection));
		connection.on('error', () => closeSocket(connection));
	});
};
