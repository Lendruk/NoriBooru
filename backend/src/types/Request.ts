import { FastifyRequest } from 'fastify';
import type { VaultInstance } from '../lib/VaultInstance';

export type Request = FastifyRequest & { vault?: VaultInstance };
