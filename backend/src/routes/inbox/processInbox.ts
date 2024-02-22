import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { INBOX_PATH } from './common';
import * as fs from 'fs/promises';
import { randomUUID } from 'crypto';
import path from 'path';
import { mediaItems } from '../../db/vault/schema';
import sharp from 'sharp';

function fileTypeFromExtension(extension: string) {
  switch(extension) {
    case 'mp4':
      return 'video';
    case 'webm':
      return 'video';
    case 'png':
      return 'image';
    case 'jpg':
      return 'image';
    case 'jpeg':
      return 'image'
    default:
      return null;
  }
}

const processInbox = async (request: Request, reply: FastifyReply) => {
  const vaultInstance = request.vault;

  if(!vaultInstance) {
    return reply.status(400).send('No vault provided');
  }
  const { db, vault } = vaultInstance;

  console.log(INBOX_PATH);
  const files = await fs.readdir(INBOX_PATH);
  for(const file of files) {
    console.log(file);
    const fileExtension = file.split('.').pop()!;
    const fileType = fileTypeFromExtension(fileExtension);

    if (!fileType) {
      continue;
    }
    const id = randomUUID();
    const finalPath = path.join(vault.path, "media", fileType === "image" ? "images" : "videos", `${id}.${fileExtension}`);
    await fs.rename(path.join(process.cwd(), 'media', 'inbox', file), finalPath);
    const stats = await fs.stat(finalPath);
    await db.insert(mediaItems).values({ fileName: id, extension: fileExtension, type: fileType, createdAt: Date.now(), fileSize: stats.size / (1024*1024) }).returning();

    // Create thumbnail in case of images
    if (fileType === "image") {
      await sharp(finalPath).jpeg({ quality: 80 }).toFile(`${vault.path}/media/images/.thumb/${id}.jpg`);
    }
  }


  return reply.send("Inbox processed");
};

export default {
	method: 'POST',
	url: '/inbox',
	handler: processInbox,
} as RouteOptions;