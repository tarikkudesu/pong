import Fastify from 'fastify';
import env from 'dotenv';

class Server {
	constructor() {
		this.fastify = Fastify();
	}

	async registerPlugins() {
		this.fastify.register(await import('@fastify/websocket'));
		this.fastify.register(await import('./game.js'));
	}

	async listen() {
		this.fastify.listen(
			{
				port: 3000,
				host: '0.0.0.0',
			},
			(err, address) => {
				if (err) {
					process.exit(1);
				}
				console.log(`fastify server is running on ${address}...`);
			}
		);
	}

	async start() {
		env.config({ path: './.env' });

		await this.registerPlugins();
		await this.listen();
	}
}

export { Server };
