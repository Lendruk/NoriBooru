import { WebSocket } from '@fastify/websocket';
import { injectable } from 'inversify';
import { WebSocketEvent } from '../types/WebSocketEvent';

type WebSocketFunction = (socket: WebSocket) => void;

@injectable()
export class WebsocketService {
	public sockets: Set<WebSocket>;

	public newConnectionMiddleware: WebSocketFunction[] = [];

	public constructor() {
		this.sockets = new Set();
	}

	public registerMiddleware(middleware: WebSocketFunction) {
		this.newConnectionMiddleware.push(middleware);
	}

	public registerWebsocketConnection(socket: WebSocket) {
		this.sockets.add(socket);

		for (const middleware of this.newConnectionMiddleware) {
			middleware(socket);
		}
		socket.on('close', () => {
			this.sockets.delete(socket);
		});
	}

	public broadcastEvent<E extends string, P extends Record<string, unknown>>(
		event: WebSocketEvent<E, P>
	): void {
		for (const socket of this.sockets) {
			socket.send(JSON.stringify(event));
		}
	}
}
