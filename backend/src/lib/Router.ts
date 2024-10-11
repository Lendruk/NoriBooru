import { WebSocket } from '@fastify/websocket';
import { FastifyReply, HTTPMethods } from 'fastify';
import { injectable } from 'inversify';
import { VaultRequest } from '../types/Request';

export type RouteHandler = (request: VaultRequest, reply: FastifyReply) => Promise<void>;

export type WebsocketHandler = (connection: WebSocket) => Promise<void> | void;

type RouteType = 'HTTP' | 'WEBSOCKET';

export type RouteDefinition = {
	method: HTTPMethods;
	url: string;
	handler: string;
	type: RouteType;
};

const routeDecorator = (method: HTTPMethods, url: string, type: RouteType = 'HTTP') => {
	return (target: object, propertyKey: string | symbol) => {
		const route: RouteDefinition = {
			method,
			url,
			type,
			handler: propertyKey as string
		};
		if (Reflect.hasMetadata('routes', target)) {
			Reflect.getMetadata('routes', target).push(route);
		} else {
			Reflect.defineMetadata('routes', [route], target);
		}
	};
};

export const Route = {
	GET: (url: string, type: RouteType = 'HTTP') => routeDecorator('GET', url, type),
	POST: (url: string) => routeDecorator('POST', url),
	PUT: (url: string) => routeDecorator('PUT', url),
	DELETE: (url: string) => routeDecorator('DELETE', url),
	PATCH: (url: string) => routeDecorator('PATCH', url)
};

@injectable()
export abstract class Router {
	public constructor() {}
}
