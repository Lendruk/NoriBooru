import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { TagTableSchema, mediaItems, tagsToMediaItems } from '../../db/vault/schema';
import { asc, desc, eq } from 'drizzle-orm';
import { checkVault } from '../../hooks/checkVault';

type BaseMediaItem = {
  id: number;
  fileName: string;
  type: string;
  extension: string;
  fileSize: number;
  createdAt: number;
  updatedAt: number | null;
  isArchived: boolean;
}

type QueryType = 'AND' | 'OR';

export type MediaItem = BaseMediaItem & {
  tags: number[];
};

export type MediaItemWithTags = BaseMediaItem & { tags: TagTableSchema[] };

export type MediaSearchQuery = { positiveTags: string, negativeTags: string, sortMethod: SortMethods, page: string, archived: string, positiveQueryType: QueryType, negativeQueryType: QueryType };

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
	const hasFilters = positiveTags.length > 0 || negativeTags.length > 0;
	const page = parseInt(query.page ?? '0');
	const rows = await db.select().from(mediaItems)
		.where(eq(mediaItems.isArchived, query.archived === 'true' ? 1 : 0))
		.orderBy(sortMethod === 'newest' ? desc(mediaItems.createdAt) : asc(mediaItems.createdAt));

	let finalMedia: MediaItem[] = [];
	for (const row of rows) {
		const tagArr: number[] = [];
		const tagPairs = await db.select().from(tagsToMediaItems).where(eq(tagsToMediaItems.mediaItemId, row.id));

		for (const tagPair of tagPairs) {
			tagArr.push(tagPair.tagId);
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
		});
	}

	finalMedia = finalMedia.sort((a, b) => sortMethod === 'newest' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt);
	if (hasFilters) {
		finalMedia = finalMedia.filter(item => {
			let positiveQueryEvaluation = true;
			if (positiveQueryType === 'AND') {
				positiveQueryEvaluation = positiveTags.every(tag => item.tags.includes(tag));
			} else {
				positiveQueryEvaluation = positiveTags.some(tag => item.tags.includes(tag));
			}

			let negativeQueryEvaluation = true;
			if(negativeQueryType === 'AND') {
				negativeQueryEvaluation = negativeTags.every(tag => !item.tags.includes(tag)); 
			}  else {
				negativeQueryEvaluation = negativeTags.some(tag => !item.tags.includes(tag)); 
			}
    
			return positiveQueryEvaluation && negativeQueryEvaluation; });
	}

	return reply.send({ mediaItems: finalMedia.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE) });
};

export default {
	method: 'GET',
	url: '/mediaItems',
	handler: searchMediaItems,
	onRequest: checkVault,
} as RouteOptions;