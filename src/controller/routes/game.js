export default async (fastify) => {
	fastify.get('/', { websocket: true }, (connection, req) => {
		console.log('WebSocket connection established');
		connection.on('message', (message) => {
			console.log('Received message:', message);
		});
		connection.on('error', (err) => {
			console.error('WebSocket error:', err);			
		});
		connection.on('close', (code, reason) => {
			console.log('WebSocket closed:', code, reason);
		});
	});
};
