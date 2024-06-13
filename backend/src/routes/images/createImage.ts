import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { TagTableSchema, mediaItems, tags as tagsTable, tagsToMediaItems } from '../../db/vault/schema';
import { randomUUID } from 'crypto';
import path from 'path';
import * as fs from 'fs/promises';
import { eq } from 'drizzle-orm';
import { checkVault } from '../../hooks/checkVault';
import ExifReader from 'exifreader';
import { Exif } from '../../types/Exif';
import sharp from 'sharp';

const createImage = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;

	if(!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { db } = vault;
	const body = request.body as { image: string, tags: TagTableSchema[] };
	const imageBase64 = body.image;
	const tags: TagTableSchema[] = body.tags;

	const id = randomUUID();
	const imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
	const imagePath = path.join(vault.path, 'media', 'images', `${id}.png`);
	await fs.writeFile(imagePath, imageBuffer);
	await sharp(imagePath).jpeg({ quality: 80 }).toFile(`${vault.path}/media/images/.thumb/${id}.jpg`);

	// TODO - Use fs.stat instead
	const fileSize = imageBuffer.byteLength;
	const exif = await ExifReader.load(imageBuffer) as Exif;
	const mediaItem = await db.insert(mediaItems).values({ 
		fileName: id, 
		extension: 'png',
		type: 'image', 
		fileSize, 
		createdAt: Date.now(), 
		exif: JSON.stringify(exif) 
	}).returning();

	if(tags && tags.length > 0) {
		await db.insert(tagsToMediaItems).values(tags.map(tag => ({ tagId: tag.id, mediaItemId: mediaItem[0].id }))).returning();
		for(const tag of tags) {
			await db.update(tagsTable).set({ mediaCount: tag.mediaCount + 1 }).where(eq(tagsTable.id, tag.id));
		}
	}

	return reply.send({ message: 'Image registered', id });
};

export default {
	method: 'POST',
	url: '/images',
	handler: createImage,
	onRequest: checkVault,
} as RouteOptions;