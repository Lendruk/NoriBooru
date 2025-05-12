import { createHash, randomUUID } from 'crypto';
import { and, asc, desc, eq, gt, inArray, lt, notInArray, or, sql } from 'drizzle-orm';
import ExifReader from 'exifreader';
import Ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs/promises';
import { inject, injectable } from 'inversify';
import path from 'path';
import sharp from 'sharp';
import {
	activeWatchers_to_mediaItems,
	lorasToMediaItems,
	MediaItemMetadataSchema,
	mediaItems,
	MediaItemSchema,
	mediaItemsMetadata,
	playlists_mediaItems_table,
	tags,
	TagSchema,
	tagsToMediaItems,
	TagsToMediaItemsSchema
} from '../db/vault/schema';
import { VaultDb } from '../lib/VaultAPI';
import { VaultService } from '../lib/VaultService';
import { ParsedExif } from '../types/Exif';
import { VaultConfig } from '../types/VaultConfig';
import { generateRandomColor } from '../utils/generateRandomColor';
import { PopulatedTag, TagService } from './TagService';

type BaseMediaItem = {
	id: number;
	fileName: string;
	type: string;
	extension: string;
	fileSize: number;
	createdAt: number;
	sdCheckpoint: string | null;
	updatedAt: number | null;
	isArchived: boolean;
	metadata?: MediaItemMetadataSchema;
	hash: string;
	originalFileName: string | null;
	source: string | null;
};

type QueryType = 'AND' | 'OR';

export type MediaItem = BaseMediaItem & {
	tags: number[];
};

export type MediaItemWithTags = BaseMediaItem & { tags: TagSchema[] };

type MediaTypes = 'ALL' | 'IMAGES' | 'VIDEOS';

export type MediaSearchQuery = {
	[index: string]: unknown;
	positiveTags?: string;
	negativeTags?: string;
	sortMethod?: SortMethods;
	page?: string;
	archived?: string;
	inbox?: string;
	positiveQueryType?: QueryType;
	negativeQueryType?: QueryType;
	mediaType?: MediaTypes;
	watcherId?: string;
	pageSize?: string;
};

export type MediaItemDetail = {
	mediaItem: MediaItemWithTags;
	next: number | undefined;
	previous: number | undefined;
	tags: TagSchema[];
};

const PAGE_SIZE = 50;
type SortMethods = 'newest' | 'oldest';

@injectable()
export class MediaService extends VaultService {
	public constructor(
		@inject('db') protected db: VaultDb,
		@inject('config') private config: VaultConfig,
		@inject(TagService) private tagService: TagService
	) {
		super(db);
	}

	private getTypeFromExtension(fileExtension: string): 'image' | 'video' {
		if (['jpg', 'webp', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
			return 'image';
		}

		if (['mp4', 'webm'].includes(fileExtension)) {
			return 'video';
		}

		throw new Error('Invalid file extension');
	}

	private getFinalExtension(fileExtension: string): string {
		if (['jpg', 'webp', 'jpeg', 'png'].includes(fileExtension)) {
			return 'png';
		}
		return fileExtension;
	}

	public async getMediaItemDetail(id: number, query: MediaSearchQuery): Promise<MediaItemDetail> {
		const mediaItem = await this.db.query.mediaItems.findFirst({
			where: eq(mediaItems.id, id),
			with: { tagsToMediaItems: true }
		});

		if (mediaItem?.isArchived === 1) {
			query.inbox = 'false';
		} else {
			query.inbox = 'true';
		}

		if (!mediaItem) {
			throw new Error('Media item not found');
		}

		const metadata = await this.db.query.mediaItemsMetadata.findFirst({
			where: eq(mediaItemsMetadata.mediaItem, mediaItem.id)
		});
		let mediaTags: TagsToMediaItemsSchema[] = [];
		try {
			mediaTags = await this.db.query.tagsToMediaItems.findMany({
				where: eq(tagsToMediaItems.mediaItemId, id)
			});
		} catch {
			// No tags
		}
		const allTags = (await this.db.query.tags.findMany()) as TagSchema[];
		const finalTags = [];

		let previousMediaItem: MediaItemSchema | undefined = undefined;
		let nextMediaItem: MediaItemSchema | undefined = undefined;
		if (query) {
			const positiveTags = query.positiveTags
				? (JSON.parse(query.positiveTags) as PopulatedTag[])
				: [];

			const queryArr = [];
			const tagQueryArr = [];
			if (positiveTags.length > 0) {
				if (query.positiveQueryType === 'OR') {
					tagQueryArr.push(
						inArray(
							tagsToMediaItems.tagId,
							positiveTags.map((tag) => tag.id)
						)
					);
				} else if (query.positiveQueryType === 'AND') {
					tagQueryArr.push(
						inArray(
							tagsToMediaItems.tagId,
							positiveTags.map((tag) => tag.id)
						)
					);
				}
			}

			const negativeTags = query.negativeTags
				? (JSON.parse(query.negativeTags) as PopulatedTag[])
				: [];

			if (negativeTags.length > 0) {
				if (query.negativeQueryType !== 'AND') {
					tagQueryArr.push(
						notInArray(
							tagsToMediaItems.tagId,
							negativeTags.map((tag) => tag.id)
						)
					);
				}
			}

			if (query.inbox) {
				queryArr.push(eq(mediaItems.isArchived, query.inbox === 'true' ? 0 : 1));
			}

			if (query.mediaType && query.mediaType !== 'ALL') {
				queryArr.push(eq(mediaItems.type, query.mediaType === 'IMAGES' ? 'image' : 'video'));
			}

			let nextItemOrderBy;
			let previousItemOrderBy;

			let nextIdSortBy;
			let previousIdSortBy;
			if (query.sortMethod === 'oldest') {
				previousItemOrderBy = asc(mediaItems.id);
				nextItemOrderBy = desc(mediaItems.id);

				nextIdSortBy = lt(mediaItems.id, id);
				previousIdSortBy = gt(mediaItems.id, id);
			} else {
				previousItemOrderBy = desc(mediaItems.id);
				nextItemOrderBy = asc(mediaItems.id);

				nextIdSortBy = gt(mediaItems.id, id);
				previousIdSortBy = lt(mediaItems.id, id);
			}

			let rawNextMediaItem: MediaItemSchema[] = [];
			try {
				if (positiveTags.length > 0 && query.positiveQueryType === 'AND') {
					const subquery = this.db
						.select({ id: tagsToMediaItems.mediaItemId })
						.from(tagsToMediaItems)
						.innerJoin(tags, eq(tagsToMediaItems.tagId, tags.id))
						.innerJoin(mediaItems, eq(tagsToMediaItems.mediaItemId, mediaItems.id))
						.where(and(...tagQueryArr, ...queryArr, nextIdSortBy))
						.groupBy(tagsToMediaItems.mediaItemId)
						.having(sql`COUNT(DISTINCT "tags"."id") = ${positiveTags.length}`)
						.orderBy(nextItemOrderBy)
						.limit(1);

					rawNextMediaItem = await this.db
						.select()
						.from(mediaItems)
						.where(eq(mediaItems.id, subquery))
						.groupBy(mediaItems.id);
				} else if (positiveTags.length > 0 && query.positiveQueryType === 'OR') {
					const subquery = this.db
						.select({ id: tagsToMediaItems.mediaItemId })
						.from(tagsToMediaItems)
						.innerJoin(tags, eq(tagsToMediaItems.tagId, tags.id))
						.innerJoin(mediaItems, eq(tagsToMediaItems.mediaItemId, mediaItems.id))
						.where(and(...tagQueryArr, ...queryArr, nextIdSortBy))
						.groupBy(tagsToMediaItems.mediaItemId)
						.orderBy(nextItemOrderBy)
						.limit(1);

					rawNextMediaItem = await this.db
						.select()
						.from(mediaItems)
						.where(eq(mediaItems.id, subquery));
				} else {
					rawNextMediaItem = await this.db
						.select()
						.from(mediaItems)
						.where(
							and(
								query.sortMethod === 'newest' ? gt(mediaItems.id, id) : lt(mediaItems.id, id),
								...queryArr
							)
						)
						.groupBy(mediaItems.id)
						.orderBy(nextItemOrderBy)
						.limit(1);
				}
			} catch (error) {
				console.log(error);
			}

			if (rawNextMediaItem.length > 0) {
				nextMediaItem = rawNextMediaItem[0];
			}

			let rawPreviousMediaItem: MediaItemSchema[] = [];
			try {
				if (positiveTags.length > 0 && query.positiveQueryType === 'AND') {
					const subquery = this.db
						.select({ id: tagsToMediaItems.mediaItemId })
						.from(tagsToMediaItems)
						.innerJoin(tags, eq(tagsToMediaItems.tagId, tags.id))
						.innerJoin(mediaItems, eq(tagsToMediaItems.mediaItemId, mediaItems.id))
						.where(and(...tagQueryArr, ...queryArr, previousIdSortBy))
						.groupBy(tagsToMediaItems.mediaItemId)
						.having(sql`COUNT(DISTINCT "tags"."id") = ${positiveTags.length}`)
						.orderBy(previousItemOrderBy)
						.limit(1);

					rawPreviousMediaItem = await this.db
						.select()
						.from(mediaItems)
						.where(and(eq(mediaItems.id, subquery), ...queryArr));
				} else if (positiveTags.length > 0 && query.positiveQueryType === 'OR') {
					const subquery = this.db
						.select({ id: tagsToMediaItems.mediaItemId })
						.from(tagsToMediaItems)
						.innerJoin(tags, eq(tagsToMediaItems.tagId, tags.id))
						.innerJoin(mediaItems, eq(tagsToMediaItems.mediaItemId, mediaItems.id))
						.where(and(...tagQueryArr, ...queryArr, previousIdSortBy))
						.groupBy(tagsToMediaItems.mediaItemId)
						.orderBy(previousItemOrderBy)
						.limit(1);

					rawPreviousMediaItem = await this.db
						.select()
						.from(mediaItems)
						.where(eq(mediaItems.id, subquery));
				} else {
					rawPreviousMediaItem = await this.db
						.select()
						.from(mediaItems)
						.where(
							and(
								query.sortMethod === 'newest' ? lt(mediaItems.id, id) : gt(mediaItems.id, id),
								...queryArr
							)
						)
						.groupBy(mediaItems.id)
						.orderBy(previousItemOrderBy)
						.limit(1);
				}
			} catch (error) {
				console.log(error);
			}

			if (rawPreviousMediaItem.length > 0) {
				previousMediaItem = rawPreviousMediaItem[0];
			}
		} else {
			nextMediaItem = await this.db.query.mediaItems.findFirst({
				where: gt(mediaItems.id, id)
			});

			previousMediaItem = await this.db.query.mediaItems.findFirst({
				where: lt(mediaItems.id, id),
				orderBy: (tb, { desc }) => [desc(tb.id)]
			});
		}

		for (const mediaTag of mediaTags) {
			const tag = await this.db.query.tags.findFirst({
				where: eq(tags.id, mediaTag.tagId)
			});
			finalTags.push(tag);
		}

		return {
			mediaItem: {
				...mediaItem,
				isArchived: mediaItem.isArchived === 1 ? true : false,
				metadata,
				tags: finalTags as TagSchema[]
			},
			next: nextMediaItem?.id,
			previous: previousMediaItem?.id,
			tags: allTags
		};
	}

	public async getMediaItem(id: number): Promise<MediaItemSchema> {
		const rawMediaItem = await this.db.query.mediaItems.findFirst({
			where: eq(mediaItems.id, id)
		});

		if (!rawMediaItem) {
			throw new Error('Media item not found');
		}

		return rawMediaItem;
	}

	public async getMediaItems(query?: MediaSearchQuery): Promise<MediaItem[]> {
		const positiveTags = JSON.parse(query?.positiveTags ?? '[]') as number[];
		const positiveQueryType = query?.positiveQueryType ?? 'AND';
		const negativeTags = JSON.parse(query?.negativeTags ?? '[]') as number[];
		const negativeQueryType = query?.negativeQueryType ?? 'AND';
		const sortMethod: SortMethods = query?.sortMethod ?? 'newest';
		const mediaType: MediaTypes = query?.mediaType ?? 'ALL';
		const hasFilters = positiveTags.length > 0 || negativeTags.length > 0;
		const page = parseInt(query?.page ?? '0');

		const mediaQueryArr = [];
		if (mediaType === 'ALL') {
			mediaQueryArr.push(or(eq(mediaItems.type, 'image'), eq(mediaItems.type, 'video')));
		} else if (mediaType === 'IMAGES') {
			mediaQueryArr.push(eq(mediaItems.type, 'image'));
		} else {
			mediaQueryArr.push(eq(mediaItems.type, 'video'));
		}

		if (query?.archived) {
			mediaQueryArr.push(eq(mediaItems.isArchived, query.archived === 'true' ? 1 : 0));
		}

		const rows = await this.db
			.select()
			.from(mediaItems)
			.where(and(...mediaQueryArr))
			.orderBy(sortMethod === 'newest' ? desc(mediaItems.createdAt) : asc(mediaItems.createdAt));

		let finalMedia: MediaItem[] = [];
		for (const row of rows) {
			const tagArr: number[] = [];
			const tagPairs = await this.db
				.select()
				.from(tagsToMediaItems)
				.where(eq(tagsToMediaItems.mediaItemId, row.id));

			for (const tagPair of tagPairs) {
				tagArr.push(tagPair.tagId);
			}

			let metadata: MediaItemMetadataSchema | undefined = undefined;

			try {
				metadata = await this.db.query.mediaItemsMetadata.findFirst({
					where: eq(mediaItemsMetadata.mediaItem, row.id)
				});
			} catch {
				// Nothing
			}

			// Very unoptimized
			// Will be changed with the remake of the search function
			if (query?.watcherId) {
				const result = await this.db.query.activeWatchers_to_mediaItems.findFirst({
					where: and(
						eq(activeWatchers_to_mediaItems.activeWatcherId, query.watcherId),
						eq(activeWatchers_to_mediaItems.mediaItemId, row.id)
					)
				});

				if (!result) continue;
			}

			finalMedia.push({
				createdAt: row.createdAt,
				extension: row.extension,
				fileName: row.fileName,
				fileSize: row.fileSize,
				id: row.id,
				isArchived: row.isArchived === 1 ? true : false,
				type: row.type,
				updatedAt: row.updatedAt,
				tags: tagArr,
				sdCheckpoint: row.sdCheckpoint,
				hash: row.hash,
				originalFileName: row.originalFileName,
				source: row.source,
				metadata
			});
		}

		finalMedia = finalMedia.sort((a, b) =>
			sortMethod === 'newest' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
		);
		if (hasFilters) {
			finalMedia = finalMedia.filter((item) => {
				let positiveQueryEvaluation = true;
				if (positiveQueryType === 'AND') {
					positiveQueryEvaluation = positiveTags.every((tag) => item.tags?.includes(tag));
				} else {
					positiveQueryEvaluation = positiveTags.some((tag) => item.tags?.includes(tag));
				}

				let negativeQueryEvaluation = true;
				if (negativeQueryType === 'AND') {
					negativeQueryEvaluation = negativeTags.every((tag) => !item.tags?.includes(tag));
				} else {
					negativeQueryEvaluation = negativeTags.some((tag) => !item.tags?.includes(tag));
				}

				return positiveQueryEvaluation && negativeQueryEvaluation;
			});
		}

		const pageSize = query?.pageSize ? Number.parseInt(query.pageSize) : PAGE_SIZE;
		return finalMedia.slice(page * pageSize, page * pageSize + pageSize + 1);
	}

	public async getItemMetadata(id: number): Promise<MediaItemMetadataSchema> {
		const metadata = await this.db.query.mediaItemsMetadata.findFirst({
			where: eq(mediaItemsMetadata.mediaItem, id)
		});

		if (!metadata) {
			throw new Error('Metadata not found');
		}
		return metadata;
	}

	public async isThereMediaItemWithSource(source: string): Promise<boolean> {
		const mediaItem = await this.db.query.mediaItems.findFirst({
			where: eq(mediaItems.source, source)
		});

		return !!mediaItem;
	}

	public async createMediaItemFromFile(options: {
		fileExtension: string;
		originalFileName?: string;
		preCalculatedId?: string;
		sdCheckPointId?: string;
		loras?: string[];
		source?: string;
	}): Promise<MediaItemSchema> {
		const { fileExtension, originalFileName, preCalculatedId, sdCheckPointId, loras, source } =
			options;
		const fileType = this.getTypeFromExtension(fileExtension);
		const id = preCalculatedId ?? randomUUID();
		const finalPath = path.join(
			this.config.path,
			'media',
			fileType === 'image' ? 'images' : 'videos',
			`${id}.${fileExtension}`
		);
		const [stats, buffer] = await Promise.all([fs.stat(finalPath), fs.readFile(finalPath)]);
		const hash = createHash('sha256');
		hash.update(Uint8Array.from(buffer));
		const hexHash = hash.digest('hex').toString();
		// Exif
		const exif = fileType === 'image' ? ((await ExifReader.load(buffer)) as ParsedExif) : null;
		const [newMediaItem] = await this.db
			.insert(mediaItems)
			.values({
				fileName: id,
				extension: fileType === 'image' ? fileExtension : finalPath.split('.').pop()!,
				type: fileType,
				createdAt: Date.now(),
				hash: hexHash,
				sdCheckpoint: sdCheckPointId,
				originalFileName,
				source,
				fileSize: stats.size / (1024 * 1024)
			})
			.returning();

		if (exif) {
			await this.processMediaItemExif(newMediaItem.id, exif);
		}

		await this.generateItemThumbnail(fileExtension, finalPath, newMediaItem);

		if (loras) {
			for (const lora of loras) {
				await this.addLoraToMediaItem(newMediaItem.id, lora);
			}
		}

		return newMediaItem;
	}

	public async generateItemThumbnail(
		fileExtension: string,
		filePath: string,
		mediaItem: MediaItemSchema
	): Promise<void> {
		if (mediaItem.type === 'image') {
			if (fileExtension === 'gif') {
				await sharp(filePath, { animated: true, limitInputPixels: false })
					.webp({ quality: 70, lossless: false })
					.toFile(`${this.config.path}/media/images/.thumb/${mediaItem.fileName}.webp`);
			} else {
				await sharp(filePath, { limitInputPixels: false })
					.jpeg({ quality: 80 })
					.toFile(`${this.config.path}/media/images/.thumb/${mediaItem.fileName}.jpg`);
			}
		} else if (mediaItem.type === 'video') {
			const thumbnailPath = path.join(
				this.config.path,
				'media',
				'videos',
				'.thumb',
				`${mediaItem.fileName}.mp4`
			);
			const conversionPromise = new Promise((resolve, reject) => {
				Ffmpeg(filePath)
					.noAudio()
					.addOutputOption('-movflags', 'frag_keyframe+empty_moov')
					.addOutputOption('-pix_fmt', 'yuv420p')
					.size('640x480')
					.autoPad()
					.withFps(24)
					.withDuration(5)
					.saveToFile(thumbnailPath)
					.on('end', () => resolve(undefined))
					.on('error', (err) => reject(err));
			});
			await conversionPromise;
		}
	}

	public async createItemFromBase64(options: {
		base64EncodedImage: string;
		fileExtension: string;
		originalFileName?: string;
		sdCheckPointId?: string;
		loras?: string[];
		source?: string;
	}): Promise<{ id: number; fileName: string }> {
		const { base64EncodedImage, fileExtension, originalFileName, sdCheckPointId, loras, source } =
			options;
		const id = randomUUID();
		const fileType = this.getTypeFromExtension(fileExtension);
		const finalExtension = this.getFinalExtension(fileExtension);
		const itemPath = path.join(
			this.config.path,
			'media',
			fileType === 'image' ? 'images' : 'videos',
			`${id}.${finalExtension}`
		);
		// const hash = createHash('sha256').update(Uint8Array.from(imageBuffer)).digest('hex').toString();
		// await fs.writeFile(itemPath, imageBuffer.toString());
		await fs.writeFile(
			itemPath,
			base64EncodedImage.replace(/^data:image\/\w+;base64,/, ''),
			'base64'
		);

		const newMediaItem = await this.createMediaItemFromFile({
			fileExtension: finalExtension,
			originalFileName,
			preCalculatedId: id,
			sdCheckPointId,
			loras,
			source
		});

		return {
			id: newMediaItem.id,
			fileName: newMediaItem.fileName
		};
	}

	public async addLoraToMediaItem(mediaItemId: number, loraId: string): Promise<void> {
		await this.db.insert(lorasToMediaItems).values({ loraId, mediaItemId });
	}

	public async addTagToMediaItem(mediaItemId: number, tagId: number): Promise<void> {
		await this.db.insert(tagsToMediaItems).values({ tagId: tagId, mediaItemId: mediaItemId });
	}

	public async setMediaItemSDCheckpoint(
		mediaItemId: number,
		sdCheckpointId: string
	): Promise<void> {
		await this.db
			.update(mediaItems)
			.set({ sdCheckpoint: sdCheckpointId })
			.where(eq(mediaItems.id, mediaItemId));
	}

	private async processMediaItemExif(
		mediaItemId: number,
		exif: ParsedExif
	): Promise<MediaItemMetadataSchema> {
		let parsedPrompt: string = '';
		if (exif.UserComment) {
			parsedPrompt = String.fromCharCode(...exif.UserComment.value.filter((v) => v)).replace(
				'UNICODE',
				''
			);
		} else if (exif.parameters) {
			parsedPrompt = exif.parameters.value;
		}
		const metadataPayload: MediaItemMetadataSchema = {
			id: randomUUID(),
			mediaItem: mediaItemId,
			width: exif['Image Width']?.value ?? 0,
			height: exif['Image Height']?.value ?? 0,
			cfgScale: null,
			denoisingStrength: null,
			loras: null,
			model: null,
			negativePrompt: null,
			positivePrompt: null,
			sampler: null,
			seed: null,
			steps: null,
			upscaleBy: null,
			upscaler: null,
			vae: null
		};

		const splitPrompt = parsedPrompt.split('\n');
		if (splitPrompt.length > 0) {
			metadataPayload.positivePrompt = splitPrompt[0];
			for (let i = 1; i < splitPrompt.length; i++) {
				const value = splitPrompt[i];
				if (value.includes('Negative prompt:')) {
					metadataPayload.negativePrompt = value.split(': ')[1];
				} else {
					const settingsObject: Record<string, string> = {};
					for (const part of value.split(',')) {
						const splitPart = part.split(': ');
						settingsObject[splitPart[0].trim()] = splitPart[1];
					}
					metadataPayload.seed = Number.parseInt(settingsObject.Seed);
					metadataPayload.model = settingsObject.Model;
					metadataPayload.sampler = settingsObject.Sampler;
					metadataPayload.steps = Number.parseInt(settingsObject.Steps);
					metadataPayload.cfgScale = Number.parseInt(settingsObject['CFG scale']);
					metadataPayload.vae = settingsObject.VAE ? settingsObject.VAE.split('.')[0] : null;

					if (settingsObject['Hires upscaler']) {
						metadataPayload.upscaler = settingsObject['Hires upscaler'];
						// isHighResEnabled = true;
						metadataPayload.denoisingStrength = Number.parseFloat(
							settingsObject['Denoising strength']
						);
						metadataPayload.upscaleBy = Number.parseFloat(settingsObject['Hires upscale']);
					} else if (settingsObject['Tiled Diffusion upscaler']) {
						metadataPayload.upscaler = settingsObject['Tiled Diffusion upscaler'];
						metadataPayload.upscaleBy = Number.parseFloat(
							settingsObject['Tiled Diffusion scale factor']
						);
						metadataPayload.denoisingStrength = Number.parseFloat(
							settingsObject['Denoising strength']
						);
					}

					// if (settingsObject.Refiner) {
					// 	isRefinerEnabled = true;
					// 	refinerCheckpoint = settingsObject.Refiner.trim().split(' ')[0];
					// 	refinerSwitchAt = Number.parseFloat(settingsObject['Refiner switch at']);
					// }
				}
			}
		}

		const [newMetadata] = await this.db
			.insert(mediaItemsMetadata)
			.values(metadataPayload)
			.returning();
		return newMetadata;
	}

	public async tagMediaItemFromPrompt(mediaItemIds: number[], prompt: string): Promise<void> {
		const aiTag = await this.tagService.getTagByName('ai');
		const tags: number[] = [];
		for (const token of prompt.split(',')) {
			let formattedToken = token.trim().replaceAll('(', '').replaceAll(')', '');

			if (formattedToken.length === 0) continue;
			if (formattedToken.startsWith('<lora:')) continue;
			if (formattedToken === 'BREAK') continue;
			// Only allow creating tags with one space between words
			if (formattedToken.split(' ').length > 2) continue;

			// If this happens a comma was probably forgotten between tokens
			if (formattedToken.includes('<lora:')) {
				for (const partialToken of formattedToken.split('<')) {
					if (!partialToken.includes('lora:')) {
						formattedToken = partialToken;
						break;
					}
				}
			}

			formattedToken = formattedToken.split(':')[0];
			let tag = await this.tagService.getTagByName(formattedToken);
			if (!tag) {
				tag = await this.tagService.createTag(formattedToken, generateRandomColor());
			}
			tags.push(tag.id);
		}

		for (const id of mediaItemIds) {
			for (const tag of tags) {
				await this.addTagToMediaItem(id, tag);
			}

			if (aiTag) {
				await this.addTagToMediaItem(id, aiTag.id);
			}
		}
	}

	public async deleteMediaItem(id: number): Promise<void> {
		const mediaItem = await this.db.query.mediaItems.findFirst({
			where: eq(mediaItems.id, id)
		});
		if (mediaItem) {
			const mediaTags = await this.db.query.tagsToMediaItems.findMany({
				where: eq(tagsToMediaItems.mediaItemId, id)
			});
			for (const mediaTag of mediaTags) {
				const tag = await this.db.query.tags.findFirst({
					where: eq(tags.id, mediaTag.tagId)
				});
				console.log(tag);
			}
			await this.db.delete(tagsToMediaItems).where(eq(tagsToMediaItems.mediaItemId, id));
			await this.db.delete(mediaItems).where(eq(mediaItems.id, id));
			await this.db
				.delete(playlists_mediaItems_table)
				.where(eq(playlists_mediaItems_table.mediaItemId, id));
			// Delete the file
			try {
				await Promise.all([
					fs.unlink(
						path.join(
							this.config.path,
							'media',
							mediaItem.type + 's',
							`${mediaItem.fileName}.${mediaItem.extension}`
						)
					),
					fs.unlink(
						path.join(
							this.config.path,
							'media',
							mediaItem.type + 's',
							'.thumb',
							`${mediaItem.fileName}.${mediaItem.type === 'video' ? 'mp4' : `${mediaItem.extension === 'gif' ? 'webp' : 'jpg'}`}`
						)
					)
				]);
			} catch (error) {
				// TODO - Add fall back for error in file deletion
			}
		}
	}

	public async toggleArchival(ids: number[], isArchived: boolean): Promise<void> {
		for (const id of ids) {
			await this.db
				.update(mediaItems)
				.set({ isArchived: isArchived ? 1 : 0 })
				.where(eq(mediaItems.id, id));
		}
	}
}
