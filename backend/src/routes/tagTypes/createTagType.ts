import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { tagTypes } from '../../db/vault/schema';
import { checkVault } from '../../hooks/checkVault';

const createTagType = async (request: Request, reply: FastifyReply) => {
  const body = request.body as { name: string; color: string };
  const vault = request.vault;

  if(!vault) {
    return reply.status(400).send('No vault provided');
  }

  const { db } = vault;

  const newTagType = await db.insert(tagTypes).values({ name: body.name, color: body.color}).returning();
  return reply.send(newTagType[0]);
};

export default {
	method: 'POST',
	url: '/tagTypes',
	handler: createTagType,
  onRequest: checkVault,
} as RouteOptions;