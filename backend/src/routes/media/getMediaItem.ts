import { and, asc, desc, eq, gt, inArray, lt, notInArray, sql } from 'drizzle-orm';
import { FastifyReply, RouteOptions } from 'fastify';
import {
	MediaItem,
	TagSchema,
	TagsToMediaItemsSchema,
	mediaItems,
	mediaItemsMetadata,
	tags,
	tagsToMediaItems
} from '../../db/vault/schema';
import { checkVault } from '../../hooks/checkVault';
import { PopulatedTag } from '../../services/TagService';
import { Request } from '../../types/Request';
import { MediaSearchQuery } from './searchMediaItems';

const getMediaItem = async (request: Request, reply: FastifyReply) => {
	const vaultInstance = request.vault;
	if (!vaultInstance) {
		return reply.status(400).send('No vault provided');
	}

	const { db } = vaultInstance;
	const { id } = request.params as { id: string };
	const parsedId = Number.parseInt(id);
	const rawQuery = request.query as MediaSearchQuery;

	const query: MediaSearchQuery | undefined = {
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

	const mediaItem = await db.query.mediaItems.findFirst({
		where: eq(mediaItems.id, parsedId),
		with: { tagsToMediaItems: true }
	});

	if (mediaItem) {
		const metadata = await db.query.mediaItemsMetadata.findFirst({
			where: eq(mediaItemsMetadata.mediaItem, mediaItem.id)
		});
		let mediaTags: TagsToMediaItemsSchema[] = [];
		try {
			mediaTags = await db.query.tagsToMediaItems.findMany({
				where: eq(tagsToMediaItems.mediaItemId, parsedId)
			});
		} catch {
			// No tags
		}
		const allTags = (await db.query.tags.findMany()) as TagSchema[];
		const finalTags = [];

		let previousMediaItem: MediaItem | undefined = undefined;
		let nextMediaItem: MediaItem | undefined = undefined;
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

				nextIdSortBy = lt(mediaItems.id, parsedId);
				previousIdSortBy = gt(mediaItems.id, parsedId);
			} else {
				previousItemOrderBy = desc(mediaItems.id);
				nextItemOrderBy = asc(mediaItems.id);

				nextIdSortBy = gt(mediaItems.id, parsedId);
				previousIdSortBy = lt(mediaItems.id, parsedId);
			}

			let rawNextMediaItem: MediaItem[] = [];
			try {
				if (positiveTags.length > 0 && query.positiveQueryType === 'AND') {
					const subquery = db
						.select({ id: tagsToMediaItems.mediaItemId })
						.from(tagsToMediaItems)
						.innerJoin(tags, eq(tagsToMediaItems.tagId, tags.id))
						.innerJoin(mediaItems, eq(tagsToMediaItems.mediaItemId, mediaItems.id))
						.where(and(...tagQueryArr, ...queryArr, nextIdSortBy))
						.groupBy(tagsToMediaItems.mediaItemId)
						.having(sql`COUNT(DISTINCT "tags"."id") = ${positiveTags.length}`)
						.orderBy(nextItemOrderBy)
						.limit(1);

					rawNextMediaItem = await db
						.select()
						.from(mediaItems)
						.where(eq(mediaItems.id, subquery))
						.groupBy(mediaItems.id);
				} else if (positiveTags.length > 0 && query.positiveQueryType === 'OR') {
					const subquery = db
						.select({ id: tagsToMediaItems.mediaItemId })
						.from(tagsToMediaItems)
						.innerJoin(tags, eq(tagsToMediaItems.tagId, tags.id))
						.innerJoin(mediaItems, eq(tagsToMediaItems.mediaItemId, mediaItems.id))
						.where(and(...tagQueryArr, ...queryArr, nextIdSortBy))
						.groupBy(tagsToMediaItems.mediaItemId)
						.orderBy(nextItemOrderBy)
						.limit(1);

					rawNextMediaItem = await db.select().from(mediaItems).where(eq(mediaItems.id, subquery));
				} else {
					rawNextMediaItem = await db
						.select()
						.from(mediaItems)
						.where(
							and(
								query.sortMethod === 'newest'
									? gt(mediaItems.id, parsedId)
									: lt(mediaItems.id, parsedId),
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

			let rawPreviousMediaItem: MediaItem[] = [];
			try {
				if (positiveTags.length > 0 && query.positiveQueryType === 'AND') {
					const subquery = db
						.select({ id: tagsToMediaItems.mediaItemId })
						.from(tagsToMediaItems)
						.innerJoin(tags, eq(tagsToMediaItems.tagId, tags.id))
						.innerJoin(mediaItems, eq(tagsToMediaItems.mediaItemId, mediaItems.id))
						.where(and(...tagQueryArr, ...queryArr, previousIdSortBy))
						.groupBy(tagsToMediaItems.mediaItemId)
						.having(sql`COUNT(DISTINCT "tags"."id") = ${positiveTags.length}`)
						.orderBy(previousItemOrderBy)
						.limit(1);

					rawPreviousMediaItem = await db
						.select()
						.from(mediaItems)
						.where(and(eq(mediaItems.id, subquery), ...queryArr));
				} else if (positiveTags.length > 0 && query.positiveQueryType === 'OR') {
					const subquery = db
						.select({ id: tagsToMediaItems.mediaItemId })
						.from(tagsToMediaItems)
						.innerJoin(tags, eq(tagsToMediaItems.tagId, tags.id))
						.innerJoin(mediaItems, eq(tagsToMediaItems.mediaItemId, mediaItems.id))
						.where(and(...tagQueryArr, ...queryArr, previousIdSortBy))
						.groupBy(tagsToMediaItems.mediaItemId)
						.orderBy(previousItemOrderBy)
						.limit(1);

					rawPreviousMediaItem = await db
						.select()
						.from(mediaItems)
						.where(eq(mediaItems.id, subquery));
				} else {
					rawPreviousMediaItem = await db
						.select()
						.from(mediaItems)
						.where(
							query.sortMethod === 'newest'
								? lt(mediaItems.id, parsedId)
								: gt(mediaItems.id, parsedId)
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
			nextMediaItem = await db.query.mediaItems.findFirst({
				where: gt(mediaItems.id, parsedId)
			});

			previousMediaItem = await db.query.mediaItems.findFirst({
				where: lt(mediaItems.id, parsedId),
				orderBy: (tb, { desc }) => [desc(tb.id)]
			});
		}

		for (const mediaTag of mediaTags) {
			const tag = await db.query.tags.findFirst({
				where: eq(tags.id, mediaTag.tagId)
			});
			finalTags.push(tag);
		}

		return reply.send({
			mediaItem: { ...mediaItem, metadata, tags: finalTags as TagSchema[] },
			next: nextMediaItem?.id,
			previous: previousMediaItem?.id,
			tags: allTags
		});
	}
};

export default {
	method: 'GET',
	url: '/mediaItems/:id',
	handler: getMediaItem,
	onRequest: checkVault
} as RouteOptions;
