import { eventEntry, closeSocket, main } from './tar/dist/ws-server.js';

export default async (fastify) => {
	main();
	fastify.get('/', { websocket: true }, (connection, req) => {
		connection.on('message', (message) => eventEntry(message.toString(), connection));
		connection.on('close', () => closeSocket(connection));
		connection.on('error', () => closeSocket(connection));
	});
};
