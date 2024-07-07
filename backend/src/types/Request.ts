import { FastifyRequest } from 'fastify';
import { VaultInstance } from '../db/VaultController';

export type Request = FastifyRequest & { vault?: VaultInstance };
