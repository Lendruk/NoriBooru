import { FastifyRequest } from 'fastify';

export type ServerRequest<T = undefined> = FastifyRequest & { body: T };
