import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { db } from '../../db/vault/db';
import { eq } from 'drizzle-orm';
import { tags } from '../../db/vault/schema';

const deleteTag = async (request: Request, reply: FastifyReply) => {
  const vault = request.vault;
  const params = request.params as { id: string };

  if(!vault) {
    return reply.status(400).send('No vault provided');
  }

  await db.delete(tags).where(eq(tags.id, Number.parseInt(params.id ?? "")));

  return reply.send();
};

export default {
	method: 'DELETE',
	url: '/tags/:id',
	handler: deleteTag,
} as RouteOptions;