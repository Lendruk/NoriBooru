import { eq } from 'drizzle-orm';
import { FastifyReply, FastifyRequest } from 'fastify';
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import { inject, injectable } from 'inversify';
import path from 'path';
import { mediaItems, tagsToMediaItems } from '../../db/vault/schema';
import { Route, Router } from '../../lib/Router';
import { VaultDb } from '../../lib/VaultAPI';
import { MediaItem, MediaItemDetail, MediaService } from '../../services/MediaService';
import { TagService } from '../../services/TagService';
import { VaultConfig } from '../../types/VaultConfig';
import { MediaSearchQuery } from './media/searchMediaItems';

@injectable()
export class MediaItemRouter extends Router {
	public constructor(
		@inject(MediaService) private mediaService: MediaService,
		@inject('config') private config: VaultConfig,
		@inject('db') private db: VaultDb,
		@inject(TagService) private tagService: TagService
	) {
		super();
	}

	@Route.GET('/media-items')
	public async getMediaItems(request: FastifyRequest): Promise<MediaItem[]> {
		return await this.mediaService.getMediaItems(request.query as MediaSearchQuery | undefined);
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
}
