import { FastifyReply, RouteOptions } from 'fastify';
import { createWriteStream } from 'fs';
import fs from 'fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { pipeline } from 'stream/promises';
import { checkVault } from '../../hooks/checkVault';
import { Job } from '../../lib/Job';
import { mediaService } from '../../services/MediaService';
import { Request } from '../../types/Request';

type MediaItemJobUpdatePayload = {
	totalFiles: number;
	currentFileIndex: number;
	currentFileName: string;
};

const getExtensionForImage = (currentExtension: string): string => {
	if (currentExtension === 'gif') {
		return 'gif';
	}
	return 'png';
};

const createMediaItems = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const mediaImportJob = new Job('media-import', 'Media import', async (job) => {
		const parts = request.parts();
		const updatePayload: MediaItemJobUpdatePayload = {
			totalFiles: 0,
			currentFileIndex: 0,
			currentFileName: ''
		};
		job.setData(updatePayload);

		for await (const part of parts) {
			if (part.type === 'file') {
				updatePayload.currentFileIndex++;
				updatePayload.currentFileName = part.filename;
				job.setData(updatePayload);
				const id = randomUUID();
				const fileType = part.mimetype.includes('image') ? 'image' : 'video';
				const currentFileExtension = part.mimetype.split('/')[1];
				const finalExtension =
					fileType === 'image' ? getExtensionForImage(currentFileExtension) : currentFileExtension;
				const finalPath = path.join(
					vault.path,
					'media',
					part.mimetype.includes('image') ? 'images' : 'videos',
					`${id}.${finalExtension}`
				);

				try {
					await pipeline(part.file, createWriteStream(finalPath));

					await mediaService.createMediaItemFromFile({
						vault,
						fileExtension: finalExtension,
						originalFileName: part.filename,
						preCalculatedId: id
					});
				} catch (error) {
					console.log(`Failed to upload file - ${part.filename}`);
					console.log(error);

					// Cleanup any possible leftover files
					try {
						await fs.unlink(finalPath);
					} catch {
						// Nothing
					}
				}
			} else if (part.fieldname === 'totalItems') {
				updatePayload.totalFiles = Number.parseInt(part.value as string);
			}
		}
	});

	vault.registerJob(mediaImportJob);
	vault.runJob(mediaImportJob.id);

	return reply.send({
		message: 'Job registered successfully!',
		id: mediaImportJob.id,
		name: mediaImportJob.name,
		tag: mediaImportJob.tag
	});
};

export default {
	method: 'POST',
	url: '/media-items',
	handler: createMediaItems,
	onRequest: checkVault
} as RouteOptions;
