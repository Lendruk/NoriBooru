import { and, asc, desc, eq, or } from 'drizzle-orm';
import { FastifyReply, RouteOptions } from 'fastify';
import {
	MediaItemMetadataSchema,
	TagSchema,
	mediaItems,
	mediaItemsMetadata,
	tagsToMediaItems
} from '../../db/vault/schema';
import { checkVault } from '../../hooks/checkVault';
import { Request } from '../../types/Request';

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
	positiveTags: string;
	negativeTags: string;
	sortMethod: SortMethods;
	page: string;
	archived: string;
	positiveQueryType: QueryType;
	negativeQueryType: QueryType;
	mediaType: MediaTypes;
};

const PAGE_SIZE = 30;
type SortMethods = 'newest' | 'oldest';

const searchMediaItems = async (request: Request, reply: FastifyReply) => {
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

	let mediaTypeQuery;
	if (mediaType === 'ALL') {
		mediaTypeQuery = or(eq(mediaItems.type, 'image'), eq(mediaItems.type, 'video'));
	} else if (mediaType === 'IMAGES') {
		mediaTypeQuery = eq(mediaItems.type, 'image');
	} else {
		mediaTypeQuery = eq(mediaItems.type, 'video');
	}

	const rows = await db
		.select()
		.from(mediaItems)
		.where(and(eq(mediaItems.isArchived, query.archived === 'true' ? 1 : 0), mediaTypeQuery))
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

	return reply.send({
		mediaItems: finalMedia.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
	});
};

export default {
	method: 'GET',
	url: '/mediaItems',
	handler: searchMediaItems,
	onRequest: checkVault
} as RouteOptions;
