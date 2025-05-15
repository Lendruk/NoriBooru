import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import ws from '@fastify/websocket';
import Fastify, { FastifyReply, RouteOptions } from 'fastify';
import { Container } from 'inversify';
import { RouteDefinition, RouteHandler, Router, WebsocketHandler } from './Router';
export abstract class IoCAPI extends Container {
	protected port: number | undefined;

	public constructor() {
		super();
	}

	public abstract init(): Promise<void>;

	public async listen(): Promise<void> {
		const app = Fastify({
			logger: true,
			bodyLimit: 100000000 // ~100mb
		});

		app.register(ws);
		app.register(cors);
		app.register(multipart, {
			limits: {
				files: 100000,
				fileSize: 107374182400
			}
		});

		const routers = this.getAll<Router>(Router);
		for (const router of routers) {
			for (const route of Reflect.getMetadata('routes', router) as RouteDefinition[]) {
				const handler: Partial<RouteOptions> = {};

				if (route.type === 'HTTP') {
					handler.handler = (router[route.handler as keyof Router] as RouteHandler).bind(router);
				} else {
					handler.handler = (_, reply: FastifyReply) => {
						reply.status(501).send('Websocket endpoint only');
					};
					handler.wsHandler = (router[route.handler as keyof Router] as WebsocketHandler).bind(
						router
					);
				}

				if (route.type === 'WEBSOCKET') {
					app.register(async () => {
						app.route({
							websocket: true,
							handler: (router[route.handler as keyof Router] as RouteHandler).bind(router),
							method: route.method,
							url: route.url
						});
					});
				} else {
					app.route({
						websocket: false,
						handler: (router[route.handler as keyof Router] as RouteHandler).bind(router),
						method: route.method,
						url: route.url
					});
				}
			}
		}

		app.listen({ port: this.port, host: '0.0.0.0' }, (err) => {
			if (err) throw err;
		});
	}
}
