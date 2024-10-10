import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { FastifyReply, FastifyRequest } from 'fastify';
import { createReadStream, createWriteStream } from 'fs';
import fs from 'fs/promises';
import { inject, injectable } from 'inversify';
import path from 'path';
import { pipeline } from 'stream/promises';
import { mediaItems, mediaItemsMetadata, tagsToMediaItems } from '../../db/vault/schema';
import { Job } from '../../lib/Job';
import { Route, Router } from '../../lib/Router';
import { VaultDb } from '../../lib/VaultAPI';
import { JobService } from '../../services/JobService';
import {
	MediaItem,
	MediaItemDetail,
	MediaSearchQuery,
	MediaService
} from '../../services/MediaService';
import { TagService } from '../../services/TagService';
import { VaultConfig } from '../../types/VaultConfig';
type MediaItemJobUpdatePayload = {
	totalFiles: number;
	currentFileIndex: number;
	currentFileName: string;
};

@injectable()
export class MediaItemRouter extends Router {
	public constructor(
		@inject(MediaService) private mediaService: MediaService,
		@inject('config') private config: VaultConfig,
		@inject('db') private db: VaultDb,
		@inject(TagService) private tagService: TagService,
		@inject(JobService) private jobs: JobService
	) {
		super();
	}

	@Route.GET('/media-items')
	public async getMediaItems(request: FastifyRequest): Promise<MediaItem[]> {
		return await this.mediaService.getMediaItems(request.query as MediaSearchQuery | undefined);
	}

	@Route.POST('/media-items')
	public async createMediaItem(request: FastifyRequest, reply: FastifyReply) {
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
						fileType === 'image'
							? this.getExtensionForImage(currentFileExtension)
							: currentFileExtension;
					const finalPath = path.join(
						this.config.path,
						'media',
						part.mimetype.includes('image') ? 'images' : 'videos',
						`${id}.${finalExtension}`
					);

					try {
						await pipeline(part.file, createWriteStream(finalPath));

						await this.mediaService.createMediaItemFromFile({
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

		this.jobs.registerJob(mediaImportJob);
		this.jobs.runJob(mediaImportJob.id);

		return reply.send({
			message: 'Job registered successfully!',
			id: mediaImportJob.id,
			name: mediaImportJob.name,
			tag: mediaImportJob.tag
		});
	}

	@Route.GET('/media-items/:id')
	public async getMediaItem(request: FastifyRequest): Promise<MediaItemDetail> {
		const { id } = request.params as { id: string };
		const parsedId = Number.parseInt(id);
		const rawQuery = request.query as MediaSearchQuery;
		const query: MediaSearchQuery = {
			positiveQueryType: 'AND',
			negativeQueryType: 'AND',
			sortMethod: 'newest'
		};
		for (const key in rawQuery) {
			if (key.startsWith('?')) {
				query[key.replace('?', '')] = rawQuery[key];
			} else {
				query[key] = rawQuery[key];
			}
		}

		return await this.mediaService.getMediaItemDetail(parsedId, query);
	}

	@Route.GET('/media-items/:id/tags')
	public async getMediaItemTags(request: FastifyRequest) {
		const { id } = request.params as { id: string };
		const parsedId = Number.parseInt(id);
		const mediaTags = await this.db.query.tagsToMediaItems.findMany({
			where: eq(tagsToMediaItems.mediaItemId, parsedId)
		});
		const finalTags = [];

		for (const mediaTag of mediaTags) {
			const tag = this.tagService.getTag(mediaTag.tagId);
			finalTags.push(tag);
		}

		return finalTags;
	}

	@Route.GET('/media-items/review')
	public async getMediaToReview(): Promise<number[]> {
		const inboxIds = await this.db
			.select({ id: mediaItems.id })
			.from(mediaItems)
			.where(eq(mediaItems.isArchived, 0));

		return inboxIds.map(({ id }) => id);
	}

	@Route.GET('/images/:fileName')
	public async getImage(request: FastifyRequest, reply: FastifyReply) {
		const params = request.params as { fileName: string };
		const fileName = params.fileName;
		const imagePath = path.join(this.config.path, 'media', 'images', `${fileName}`);
		const image = await fs.readFile(imagePath);

		return reply.header('Content-Type', 'image/jpg').send(image);
	}

	@Route.GET('/images/thumb/:fileName')
	public async getImageThumbnail(request: FastifyRequest, reply: FastifyReply) {
		const params = request.params as { fileName: string };
		const fileName = params.fileName;
		const thumbnailPath = path.join(this.config.path, 'media', 'images', '.thumb', `${fileName}`);

		let image: Buffer | undefined;
		try {
			image = await fs.readFile(thumbnailPath);
		} catch (error) {
			if ((error as { code: string }).code === 'ENOENT') {
				const item = await this.db.query.mediaItems.findFirst({
					where: eq(mediaItems.fileName, fileName.split('.')[0])
				});

				if (item) {
					const filePath = path.join(
						this.config.path,
						'media',
						'images',
						`${item.fileName}.${item.extension}`
					);
					await this.mediaService.generateItemThumbnail(item.extension, filePath, item);
					image = await fs.readFile(thumbnailPath);
				}
			}
		}

		if (!image) {
			return reply.status(404).send();
		} else {
			return reply.header('Content-Type', 'image/jpg').send(image);
		}
	}

	@Route.GET('/videos/thumb/:fileName')
	public async getVideoThumbnail(request: FastifyRequest, reply: FastifyReply) {
		const params = request.params as { fileName: string };
		const fileName = params.fileName;
		const thumbnailPath = path.join(this.config.path, 'media', 'videos', '.thumb', `${fileName}`);

		let video: Buffer | undefined;
		try {
			video = await fs.readFile(thumbnailPath);
		} catch (error) {
			if ((error as { code: string }).code === 'ENOENT') {
				const item = await this.db.query.mediaItems.findFirst({
					where: eq(mediaItems.fileName, fileName.split('.')[0])
				});

				if (item) {
					const filePath = path.join(
						this.config.path,
						'media',
						'videos',
						`${item.fileName}.${item.extension}`
					);
					await this.mediaService.generateItemThumbnail(item.extension, filePath, item);
					video = await fs.readFile(thumbnailPath);
				}
			}
		}

		if (!video) {
			return reply.status(404).send();
		} else {
			return reply.header('Content-Type', 'image/mp4').send(video);
		}
	}

	@Route.DELETE('/media-items/:ids')
	public async deleteMediaItem(request: FastifyRequest, reply: FastifyReply) {
		const { ids } = request.params as { ids: string };
		const maybeArray = JSON.parse(ids);

		let parsedIdArray: string[] = [];
		if (Array.isArray(maybeArray)) {
			parsedIdArray = maybeArray;
		} else {
			parsedIdArray = [maybeArray];
		}

		try {
			for (const rawId of parsedIdArray) {
				const parsedId = Number.parseInt(rawId ?? '');
				if (parsedId) {
					await this.mediaService.deleteMediaItem(parsedId);
				}
			}
		} catch (error) {
			console.log(error);
			return reply.status(400).send({ message: error });
		}
		return reply.send({ message: 'Media item deleted successfully' });
	}

	@Route.GET('/videos/:fileName')
	public async getVideo(request: FastifyRequest, reply: FastifyReply) {
		const params = request.params as { vaultId: string; fileName: string };
		const vaultId = params.vaultId;
		if (!vaultId) {
			return reply.status(400).send('Vault ID is required');
		}

		const fileName = params.fileName;
		const videoPath = path.join(this.config.path, 'media', 'videos', fileName!);

		const stats = await fs.stat(videoPath);

		const range = request.headers.range;
		if (!range) {
			// 416 Wrong range
			return reply.status(416).send();
		}

		const positions = range.replace(/bytes=/, '').split('-');
		const start = parseInt(positions[0], 10);
		const total = stats.size;
		const end = positions[1] ? parseInt(positions[1], 10) : total - 1;
		const chunksize = end - start + 1;

		const videoStream = createReadStream(videoPath, {
			start,
			end: end === total - 1 ? total : end
		});
		return reply
			.code(206)
			.header('Content-Range', `bytes ${start}-${end}/${total}`)
			.header('Content-Length', chunksize)
			.header('Content-Type', `video/${videoPath.split('.').pop()!}`)
			.header('accept-ranges', 'bytes')
			.send(videoStream);
	}

	@Route.PATCH('/media-items/:id/auto-tag')
	public async autoTagMediaItem(request: FastifyRequest, reply: FastifyReply) {
		try {
			const { id: rawId } = request.params as { id: string };
			const id = Number.parseInt(rawId);
			const metadata = await this.db.query.mediaItemsMetadata.findFirst({
				where: eq(mediaItemsMetadata.mediaItem, id)
			});
			if (metadata?.positivePrompt) {
				await this.mediaService.tagMediaItemFromPrompt([id], metadata.positivePrompt);
			}
		} catch (error) {
			return reply.status(400).send({ message: error });
		}

		return reply.send({ message: 'Tag added successfully' });
	}

	@Route.PATCH('/media-items/:ids')
	public async toggleArchival(request: FastifyRequest, reply: FastifyReply) {
		const { ids } = request.params as { ids: string };
		const parsedIdArray: string[] = JSON.parse(ids);
		const { isArchived } = request.body as { isArchived: boolean };
		try {
			await this.mediaService.toggleArchival(
				parsedIdArray.map((id) => Number.parseInt(id)),
				isArchived
			);
		} catch (error) {
			console.log(error);
			return reply.status(400).send(error);
		}

		return reply.send({ message: 'Item archival status switched' });
	}

	private getExtensionForImage = (currentExtension: string): string => {
		if (currentExtension === 'gif') {
			return 'gif';
		}
		return 'png';
	};
}
