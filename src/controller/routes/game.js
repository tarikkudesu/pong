import { WS } from './tar/dist/ws-server.js';

export default async (fastify) => {
	fastify.get('/', { websocket: true }, (connection, req) => {
		console.log('WebSocket connection established');
		connection.on('message', (message) => {
			console.log('Received message:', message.toString());
			try {
				WS.useParser(message.toString(), connection);
			} catch (error) {
				console.error('Error processing message:', error.message);
			}
		});
		connection.on('error', (err) => {
			console.error('WebSocket error:', err);
			WS.closeSocket(connection);
		});
		connection.on('close', (code, reason) => {
			WS.closeSocket(connection);
			console.log('WebSocket closed:', code, reason);
		});
	});
};
