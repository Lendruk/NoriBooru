import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { db } from '../../db/vault/db';
import {  Tag, mediaItems, tags, tagsToMediaItems } from '../../db/vault/schema';
import { eq, gt, lt } from 'drizzle-orm';

const getMediaItem = async (request: Request, reply: FastifyReply) => {
  const vault = request.vault;
  if(!vault) {
    return reply.status(400).send('No vault provided');
  }

  const { id } = request.params as { id: string };
  const parsedId = Number.parseInt(id);
  const mediaItem = await db.query.mediaItems.findFirst({ where: eq(mediaItems.id, parsedId), with: { tagsToMediaItems: true }});
  const mediaTags = await db.query.tagsToMediaItems.findMany({ where: eq(tagsToMediaItems.mediaItemId, parsedId) });
  const allTags = await db.query.tags.findMany({ with: { tagType: true }}) as Tag[];
  let finalTags = [];
  const nextMediaItem = await db.query.mediaItems.findFirst({ where: gt(mediaItems.id, parsedId) });
  const previousMediaItem = await db.query.mediaItems.findFirst({ where: lt(mediaItems.id, parsedId), orderBy: (tb, { desc }) => [desc(tb.id)],});

  for (const mediaTag of mediaTags) {
    const tag = await db.query.tags.findFirst({ where: eq(tags.id, mediaTag.tagId), with: { tagType: true }  });
    finalTags.push(tag);
  }

  return reply.send({mediaItem: { ...mediaItem, tags: finalTags as Tag[] }, next: nextMediaItem?.id, previous: previousMediaItem?.id, tags: allTags });
};

export default {
	method: 'GET',
	url: '/mediaItems/:id',
	handler: getMediaItem,
} as RouteOptions;