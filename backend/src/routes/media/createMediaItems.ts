import { FastifyReply, RouteOptions } from 'fastify';
import ffmpeg from 'fluent-ffmpeg';
import { createWriteStream } from 'fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import util from 'node:util';
import { checkVault } from '../../hooks/checkVault';
import { mediaService } from '../../services/MediaService';
import { Request } from '../../types/Request';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { pipeline } = require('node:stream');
const pump = util.promisify(pipeline);

const createMediaItems = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const parts = request.parts();
	for await (const part of parts) {
		if (part.type === 'file') {
			const id = randomUUID();
			const fileType = part.mimetype.includes('image') ? 'image' : 'video';
			const currentFileExtension = part.mimetype.split('/')[1];
			const finalExtension = fileType === 'image' ? 'png' : 'mp4';
			const finalPath = path.join(
				vault.path,
				'media',
				part.mimetype.includes('image') ? 'images' : 'videos',
				`${id}.${finalExtension}`
			);

			try {
				if (fileType === 'video' && currentFileExtension !== 'mp4') {
					const conversionPromise = new Promise((resolve, reject) => {
						ffmpeg(part.file)
							.saveToFile(finalPath)
							.on('end', () => resolve(undefined))
							.on('error', (err) => reject(err));
					});
					await conversionPromise;
				} else {
					await pump(part.file, createWriteStream(finalPath));
				}

				await mediaService.createMediaItemFromFile(vault, finalPath, fileType, id);
			} catch (error) {
				console.log(`Failed to upload file - ${part.filename}`);
				console.log(error);
			}
		} else {
			console.log(part);
		}
	}
	return reply.send({ message: 'Upload completed!' });
};

export default {
	method: 'POST',
	url: '/mediaItems',
	handler: createMediaItems,
	onRequest: checkVault
} as RouteOptions;
