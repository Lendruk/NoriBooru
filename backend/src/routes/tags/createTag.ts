import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { db } from '../../db/vault/db';
import { tags } from '../../db/vault/schema';

const createTag = async (request: Request, reply: FastifyReply) => {
  const vault = request.vault;
  const body = request.body as { name: string, tagTypeId: number };

  if(!vault) {
    return reply.status(400).send('No vault provided');
  }

  const newTag = await db.insert(tags).values({ name: body.name, tagTypeId: body.tagTypeId}).returning();

  return reply.send(newTag);
};

export default {
	method: 'POST',
	url: '/tags',
	handler: createTag,
} as RouteOptions;