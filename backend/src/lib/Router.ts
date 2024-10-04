import { FastifyReply, HTTPMethods } from 'fastify';
import { injectable } from 'inversify';
import { VaultRequest } from '../types/Request';

export type RouteHandler = (request: VaultRequest, reply: FastifyReply) => Promise<void>;

export type RouteDefinition = {
	method: HTTPMethods;
	url: string;
	handler: string;
};

const routeDecorator = (method: HTTPMethods, url: string) => {
	return (target: object, propertyKey: string | symbol) => {
		const route: RouteDefinition = {
			method,
			url,
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
	GET: (url: string) => routeDecorator('GET', url),
	POST: (url: string) => routeDecorator('POST', url),
	PUT: (url: string) => routeDecorator('PUT', url),
	DELETE: (url: string) => routeDecorator('DELETE', url),
	PATCH: (url: string) => routeDecorator('PATCH', url)
};

@injectable()
export abstract class Router {
	public constructor() {}
}
