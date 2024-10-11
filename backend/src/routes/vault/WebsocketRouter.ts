import { WebSocket } from '@fastify/websocket';
import { inject, injectable } from 'inversify';
import { Route, Router } from '../../lib/Router';
import { WebsocketService } from '../../services/WebsocketService';

type WebSocketRegisterEvent = {
	type: 'register';
	data: { vault: string };
};

@injectable()
export class WebsocketRouter extends Router {
	public constructor(
		@inject(WebsocketService) private readonly websocketService: WebsocketService
	) {
		super();
	}

	@Route.GET('/ws', 'WEBSOCKET')
	public async index(connection: WebSocket) {
		connection.on('message', async (message) => {
			const event = JSON.parse(message.toString()) as WebSocketRegisterEvent;
			console.log(event);

			try {
				if (event.type === 'register') {
					this.websocketService.registerWebsocketConnection(connection);
				}
			} catch (error) {
				console.log(error);
				console.error('There was an error establishing the websocket connection');
			}
		});
	}
}
