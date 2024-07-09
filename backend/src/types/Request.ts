import { FastifyRequest } from 'fastify';
import { VaultInstance } from '../lib/VaultInstance';

export type Request = FastifyRequest & { vault?: VaultInstance };
