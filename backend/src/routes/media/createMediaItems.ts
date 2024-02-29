import { FastifyReply, RouteOptions } from "fastify";
import { checkVault } from "../../hooks/checkVault";
import { Request } from "../../types/Request";
import util from 'node:util';
import {createWriteStream} from 'fs';
import * as fs from 'fs/promises';
import { randomUUID } from "node:crypto";
import path from "node:path";
import { mediaItems } from "../../db/vault/schema";
import sharp from "sharp";
import ffmpeg from 'fluent-ffmpeg';
const { pipeline } = require('node:stream')
const pump = util.promisify(pipeline)

const createMediaItems = async (request: Request, reply: FastifyReply) => {
  const vaultInstance = request.vault;

  if(!vaultInstance) {
    return reply.status(400).send('No vault provided');
  }
  const { db, vault } = vaultInstance;
  
  const parts = request.parts();
  for await (const part of parts) {
    if (part.type === 'file') {
      const id = randomUUID();
      const fileType = part.mimetype.includes("image") ? "image" : "video";
      const currentFileExtension = part.mimetype.split('/')[1];
      const finalExtension = fileType === "image" ? "png" : "mp4";
      const finalPath = path.join(vault.path, "media", part.mimetype.includes("image") ? "images" : "videos", `${id}.${finalExtension}`);

      console.log(currentFileExtension);
      if (fileType === "video" && currentFileExtension !== "mp4") {
        const conversionPromise = new Promise((resolve, reject) => {
          ffmpeg(part.file).saveToFile(finalPath)
          .on('end', () => resolve(undefined))
          .on('error', (err) => reject(err));
        });
        await conversionPromise;
      } else {
        await pump(part.file, createWriteStream(finalPath));
      }
      console.log("after");

      const stats = await fs.stat(finalPath);
      await db.insert(mediaItems).values({ fileName: id, extension: finalExtension, type: fileType, createdAt: Date.now(), fileSize: stats.size / (1024*1024) }).returning();

      // Create thumbnail in case of images
      if (fileType === "image") {
        await sharp(finalPath).jpeg({ quality: 80 }).toFile(`${vault.path}/media/images/.thumb/${id}.jpg`);
      }
    } else {
      console.log(part)
    }
  }
  return reply.send({ message: "Upload completed!" });
}

export default {
	method: 'POST',
	url: '/mediaItems',
	handler: createMediaItems,
  onRequest: checkVault,
} as RouteOptions;