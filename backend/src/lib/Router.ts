import { FastifyReply, HTTPMethods } from 'fastify';
import { VaultRequest } from '../types/Request';

type RouteHandler = (request: VaultRequest, reply: FastifyReply) => Promise<void>;

export type RouteDefinition = {
	method: HTTPMethods;
	url: string;
	handler: RouteHandler;
};

const routeDecorator = (method: HTTPMethods, url: string) => {
	return (target: unknown, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
		const handler = descriptor.value as RouteHandler;
		const route: RouteDefinition = {
			method,
			url,
			handler: handler.bind(target)
		};
		(target as Router).routes.push(route);
	};
};

export const Route = {
	GET: (url: string) => routeDecorator('GET', url),
	POST: (url: string) => routeDecorator('POST', url),
	PUT: (url: string) => routeDecorator('PUT', url),
	DELETE: (url: string) => routeDecorator('DELETE', url),
	PATCH: (url: string) => routeDecorator('PATCH', url)
};

export abstract class Router {
	public routes: RouteDefinition[] = [];
}
