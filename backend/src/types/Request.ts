import { FastifyRequest } from 'fastify';
import type { VaultInstance } from '../lib/VaultInstance';

export type VaultRequest = FastifyRequest & { vault?: VaultInstance };
