import { FastifyReply, RouteOptions } from 'fastify';
import ffmpeg from 'fluent-ffmpeg';
import { createWriteStream } from 'fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import util from 'node:util';
import { checkVault } from '../../hooks/checkVault';
import { Job } from '../../services/JobService';
import { mediaService } from '../../services/MediaService';
import { Request } from '../../types/Request';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { pipeline } = require('node:stream');
const pump = util.promisify(pipeline);

type MediaItemJobUpdatePayload = {
	totalFiles: number;
	currentFileIndex: number;
	currentFileName: string;
};

const createMediaItems = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const mediaImportJob = new Job('media-import', 'Media import', async (emitter) => {
		const parts = request.parts();
		const updatePayload: MediaItemJobUpdatePayload = {
			totalFiles: 0,
			currentFileIndex: 0,
			currentFileName: ''
		};
		for await (const part of parts) {
			if (part.type === 'file') {
				updatePayload.currentFileIndex++;
				updatePayload.currentFileName = part.filename;
				emitter.emit('update', updatePayload);
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
			} else if (part.fieldname === 'totalItems') {
				updatePayload.totalFiles = Number.parseInt(part.value as string);
			}
		}
	});

	mediaImportJob.on('update', (payload: MediaItemJobUpdatePayload) => {
		console.log(payload);

		vault.broadcastEvent({
			event: 'job-update',
			data: {
				jobId: mediaImportJob.id,
				jobName: mediaImportJob.name,
				jobTag: mediaImportJob.tag,
				payload
			}
		});
	});
	vault.jobService.registerJob(mediaImportJob);
	vault.jobService.runJob(mediaImportJob.id);

	return reply.send({ message: 'Job registered successfully!', jobId: mediaImportJob.id });
};

export default {
	method: 'POST',
	url: '/mediaItems',
	handler: createMediaItems,
	onRequest: checkVault
} as RouteOptions;
