import { WS } from './tar/dist/index.js';

export default async (fastify) => {
	WS.main();
	fastify.get('/', { websocket: true }, (connection, req) => {
		connection.on('message', (message) => {
			try {
				WS.useParser(message.toString(), connection);
			} catch (error) {
				console.error('\x1b[31mError processing message:', error.message);
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
				WS.closeSocket(connection);
			} catch (error) {
				console.error('Error processing message:', error.message);
			}
		});
	});
};
