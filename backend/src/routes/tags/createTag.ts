import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { tags } from '../../db/vault/schema';
import { checkVault } from '../../hooks/checkVault';

const createTag = async (request: Request, reply: FastifyReply) => {
  const vaultInstance = request.vault;
  const body = request.body as { name: string, color: string, parentId?: number };
  if(!vaultInstance) {
    return reply.status(400).send('No vault provided');
  }

  const { db } = vaultInstance;
  const newTag = await db.insert(tags).values({ name: body.name, color: body.color, parentTagId: body.parentId }).returning();

  return reply.send(newTag[0]);
};

export default {
	method: 'POST',
	url: '/tags',
	handler: createTag,
  onRequest: checkVault,
} as RouteOptions;