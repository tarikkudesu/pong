import { WS } from './tar/dist/index.js';

export default async (fastify) => {
	WS.main();
	fastify.get('/', { websocket: true }, (connection, req) => {
		connection.on('message', (message) => {
			try {
				console.log('Received message:', message.toString());
				WS.useParser(message.toString(), connection);
			} catch (error) {
				console.error('Error processing message:', error.message);
			}
		});
		connection.on('error', (err) => {
			try {
				console.error('WebSocket error:', err);
				WS.closeSocket(connection);
			} catch (error) {
				console.error('Error processing message:', error.message);
			}
		});
		connection.on('close', (code, reason) => {
			try {
				console.log('WebSocket closed:', code, reason);
				WS.closeSocket(connection);
			} catch (error) {
				console.error('Error processing message:', error.message);
			}
		});
	});
};
