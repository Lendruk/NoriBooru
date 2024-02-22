import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { db } from '../../db/vault/db';
import {  Tag, tags, tagsToMediaItems } from '../../db/vault/schema';
import { eq } from 'drizzle-orm';

const addTagToMediaItem = async (request: Request, reply: FastifyReply) => {
  const vault = request.vault;
  if(!vault) {
    return reply.status(400).send('No vault provided');
  }

  const { id } = request.params as { id: string };
  const body = request.body as Tag;
  
  try {
    if (id) {
      await db.insert(tagsToMediaItems).values({ tagId: body.id, mediaItemId: Number.parseInt(id) });
      await db.update(tags).set({ mediaCount: body.mediaCount + 1 }).where(eq(tags.id, body.id));
    }
  } catch(error) {
    return reply.status(400).send({ message: error });
  }
};

export default {
	method: 'PUT',
	url: '/mediaItems/:id/tags',
	handler: addTagToMediaItem,
} as RouteOptions;