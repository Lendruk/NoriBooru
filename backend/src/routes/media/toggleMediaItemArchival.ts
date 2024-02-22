import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { db } from '../../db/vault/db';
import { mediaItems } from '../../db/vault/schema';
import { eq } from 'drizzle-orm';

const toggleMediaItemArchival = async (request: Request, reply: FastifyReply) => {
  const vault = request.vault;
  if(!vault) {
    return reply.status(400).send('No vault provided');
  }

  const { id } = request.params as { id: string };
  const parsedId = Number.parseInt(id ?? "");
  const body = request.body as { isArchived: boolean };
  try {
    await db.update(mediaItems).set({ isArchived: body.isArchived ? 1 : 0 }).where(eq(mediaItems.id, parsedId));
  } catch(error) {
    console.log(error);
    return reply.status(400).send(error);
  }
};

export default {
	method: 'PATCH',
	url: '/mediaItems/:id',
	handler: toggleMediaItemArchival,
} as RouteOptions;