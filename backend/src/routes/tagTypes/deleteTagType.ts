import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { tagTypes } from '../../db/vault/schema';
import { eq } from 'drizzle-orm';

const deleteTagType = async (request: Request, reply: FastifyReply) => {
  const vault = request.vault;
  const params = request.params as { id: string };

  if(!vault) {
    return reply.status(400).send('No vault provided');
  }

  const { db } = vault;
  await db.delete(tagTypes).where(eq(tagTypes.id, Number.parseInt(params.id ?? "")));
	reply.send();
};

export default {
	method: 'DELETE',
	url: '/tagTypes/:id',
	handler: deleteTagType,
} as RouteOptions;