import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { db } from '../../db/vault/db';
import { mediaItems, tags, tagsToMediaItems } from '../../db/vault/schema';
import { eq } from 'drizzle-orm';
import path from 'path';
import * as fs from 'fs/promises'; 

const deleteMediaItem = async (request: Request, reply: FastifyReply) => {
  const vaultInstance = request.vault;
  if(!vaultInstance) {
    return reply.status(400).send('No vault provided');
  }

  const { id } = request.params as { id: string };
  const parsedId = Number.parseInt(id ?? "");
  const { vault } = vaultInstance;
  try {
    if (parsedId) {
      const mediaItem = await db.query.mediaItems.findFirst({ where: eq(mediaItems.id, parsedId) });
      if(mediaItem) {
        const mediaTags = await db.query.tagsToMediaItems.findMany({ where: eq(tagsToMediaItems.mediaItemId, parsedId) });
        for(const mediaTag of mediaTags) {
          const tag = await db.query.tags.findFirst({ where: eq(tags.id, mediaTag.tagId) });
          console.log(tag);
          await db.update(tags).set({ mediaCount: tag!.mediaCount - 1 }).where(eq(tags.id, tag!.id));
        }
        await db.delete(tagsToMediaItems).where(eq(tagsToMediaItems.mediaItemId, parsedId));
        await db.delete(mediaItems).where(eq(mediaItems.id, parsedId));
        // Delete the file
        try {
          await Promise.all([
            fs.unlink(path.join(vault.path, "media", mediaItem.type + 's', `${mediaItem.fileName}.${mediaItem.extension}`)),
            fs.unlink(path.join(vault.path, "media", mediaItem.type + 's', ".thumb", `${mediaItem.fileName}.jpg`)),
          ]);
        } catch (error) {
          // TODO - Add fall back for error in file deletion
        }
      }
    }
  } catch(error) {
    console.log(error);
    return reply.status(400).send({ message: error });
  }
};

export default {
	method: 'DELETE',
	url: '/mediaItems/:id',
	handler: deleteMediaItem,
} as RouteOptions;