import { WebSocket } from '@fastify/websocket';
import { FastifyReply, RouteOptions } from 'fastify';
import { VaultController } from '../db/VaultController';
import { VaultAPI } from '../lib/VaultAPI';

type WebSocketRegisterEvent = {
	type: 'register';
	data: { vault: string };
};

const websocketHandler = (connection: WebSocket) => {
	connection.on('message', async (message) => {
		const event = JSON.parse(message.toString()) as WebSocketRegisterEvent;
		console.log(event);

		try {
			if (event.type === 'register') {
				let vault: VaultAPI;
				try {
					vault = VaultController.getVault(event.data.vault);
				} catch {
					vault = await VaultController.registerVault(event.data.vault);
				}
				vault!.websockets.registerWebsocketConnection(connection);
			}
		} catch (error) {
			console.log(error);
			console.error('There was an error establishing the websocket connection');
		}
	});
};

export default {
	method: 'GET',
	url: '/',
	handler: (_, reply: FastifyReply) => {
		reply.status(501).send('Websocket endpoint only');
	},
	wsHandler: websocketHandler
} satisfies RouteOptions;
