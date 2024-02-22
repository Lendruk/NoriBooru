import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { db } from '../../db/vault/db';
import { Tag, mediaItems, tags as tagsTable, tagsToMediaItems } from '../../db/vault/schema';
import { randomUUID } from 'crypto';
import path from 'path';
import * as fs from 'fs/promises';
import { eq } from 'drizzle-orm';

const createImage = async (request: Request, reply: FastifyReply) => {
  const vaultInstance = request.vault;

  if(!vaultInstance) {
    return reply.status(400).send('No vault provided');
  }

  const { vault } = vaultInstance;

  const body = request.body as { image: string, tags: Tag[] };
  const imageBase64 = body.image;
  const tags: Tag[] = body.tags;

  const id = randomUUID();
  const imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
  await fs.writeFile(path.join(vault.path, "media", 'images', `${id}.png`), imageBuffer);
  // TODO - Use fs.stat instead
  const fileSize = imageBuffer.byteLength;
  console.log(id);
  const mediaItem = await db.insert(mediaItems).values({  fileName: id, extension: "png", type: "image", fileSize, createdAt: Date.now() }).returning();

  if(tags && tags.length > 0) {
    await db.insert(tagsToMediaItems).values(tags.map(tag => ({ tagId: tag.id, mediaItemId: mediaItem[0].id }))).returning();
    for(const tag of tags) {
      await db.update(tagsTable).set({ mediaCount: tag.mediaCount + 1 }).where(eq(tagsTable.id, tag.id));
    }
  }

  return reply.send({ message: "Image registered", id });
};

export default {
	method: 'POST',
	url: '/images',
	handler: createImage,
} as RouteOptions;