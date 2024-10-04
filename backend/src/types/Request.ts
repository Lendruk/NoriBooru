import { FastifyRequest } from 'fastify';
import { VaultAPI } from '../lib/VaultAPI';

export type VaultRequest = FastifyRequest & { vault?: VaultAPI };
