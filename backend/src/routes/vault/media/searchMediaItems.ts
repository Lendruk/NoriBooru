import { and, asc, desc, eq, or } from 'drizzle-orm';
import { FastifyReply, RouteOptions } from 'fastify';
import {
	MediaItemMetadataSchema,
	TagSchema,
	activeWatchers_to_mediaItems,
	mediaItems,
	mediaItemsMetadata,
	tagsToMediaItems
} from '../../../db/vault/schema';
import { checkVault } from '../../../hooks/checkVault';
import { VaultRequest } from '../../../types/Request';

type BaseMediaItem = {
	id: number;
	fileName: string;
	type: string;
	extension: string;
	fileSize: number;
	createdAt: number;
	updatedAt: number | null;
	isArchived: boolean;
	metadata?: MediaItemMetadataSchema;
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

const PAGE_SIZE = 50;
type SortMethods = 'newest' | 'oldest';

const searchMediaItems = async (request: VaultRequest, reply: FastifyReply) => {
	const vaultInstance = request.vault;
	const query = request.query as MediaSearchQuery;

	if (!vaultInstance) {
		return reply.status(400).send('No vault provided');
	}

	const { db } = vaultInstance;
	const positiveTags = JSON.parse(query.positiveTags ?? '[]') as number[];
	const positiveQueryType = query.positiveQueryType ?? 'AND';
	const negativeTags = JSON.parse(query.negativeTags ?? '[]') as number[];
	const negativeQueryType = query.negativeQueryType ?? 'AND';
	const sortMethod: SortMethods = query.sortMethod ?? 'newest';
	const mediaType: MediaTypes = query.mediaType ?? 'ALL';

	const hasFilters = positiveTags.length > 0 || negativeTags.length > 0;
	const page = parseInt(query.page ?? '0');

	const mediaQueryArr = [];
	if (mediaType === 'ALL') {
		mediaQueryArr.push(or(eq(mediaItems.type, 'image'), eq(mediaItems.type, 'video')));
	} else if (mediaType === 'IMAGES') {
		mediaQueryArr.push(eq(mediaItems.type, 'image'));
	} else {
		mediaQueryArr.push(eq(mediaItems.type, 'video'));
	}

	if (query.archived) {
		mediaQueryArr.push(eq(mediaItems.isArchived, query.archived === 'true' ? 1 : 0));
	}

	const rows = await db
		.select()
		.from(mediaItems)
		.where(and(...mediaQueryArr))
		.orderBy(sortMethod === 'newest' ? desc(mediaItems.createdAt) : asc(mediaItems.createdAt));

	let finalMedia: MediaItem[] = [];
	for (const row of rows) {
		const tagArr: number[] = [];
		const tagPairs = await db
			.select()
			.from(tagsToMediaItems)
			.where(eq(tagsToMediaItems.mediaItemId, row.id));

		for (const tagPair of tagPairs) {
			tagArr.push(tagPair.tagId);
		}

		let metadata: MediaItemMetadataSchema | undefined = undefined;

		try {
			metadata = await db.query.mediaItemsMetadata.findFirst({
				where: eq(mediaItemsMetadata.mediaItem, row.id)
			});
		} catch {
			// Nothing
		}

		// Very unoptimized
		// Will be changed with the remake of the search function
		if (query.watcherId) {
			const result = await db.query.activeWatchers_to_mediaItems.findFirst({
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
				positiveQueryEvaluation = positiveTags.every((tag) => item.tags.includes(tag));
			} else {
				positiveQueryEvaluation = positiveTags.some((tag) => item.tags.includes(tag));
			}

			let negativeQueryEvaluation = true;
			if (negativeQueryType === 'AND') {
				negativeQueryEvaluation = negativeTags.every((tag) => !item.tags.includes(tag));
			} else {
				negativeQueryEvaluation = negativeTags.some((tag) => !item.tags.includes(tag));
			}

			return positiveQueryEvaluation && negativeQueryEvaluation;
		});
	}

	const pageSize = query.pageSize ? Number.parseInt(query.pageSize) : PAGE_SIZE;
	return reply.send({
		mediaItems: finalMedia.slice(page * pageSize, page * pageSize + pageSize + 1)
	});
};

export default {
	method: 'GET',
	url: '/media-items',
	handler: searchMediaItems,
	onRequest: checkVault
} as RouteOptions;
