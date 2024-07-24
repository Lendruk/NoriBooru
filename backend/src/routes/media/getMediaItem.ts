import { eq, gt, lt } from 'drizzle-orm';
import { FastifyReply, RouteOptions } from 'fastify';
import { TagSchema, mediaItems, mediaItemsMetadata, tags, tagsToMediaItems } from '../../db/vault/schema';
import { checkVault } from '../../hooks/checkVault';
import { Request } from '../../types/Request';

const getMediaItem = async (request: Request, reply: FastifyReply) => {
	const vaultInstance = request.vault;
	if (!vaultInstance) {
		return reply.status(400).send('No vault provided');
	}

	const { db } = vaultInstance;
	const { id } = request.params as { id: string };
	const parsedId = Number.parseInt(id);
	const mediaItem = await db.query.mediaItems.findFirst({
		where: eq(mediaItems.id, parsedId),
		with: { tagsToMediaItems: true }
	});
	if (mediaItem) {
		const metadata = await db.query.mediaItemsMetadata.findFirst({ where: eq(mediaItemsMetadata.mediaItem, mediaItem.id) });
		const mediaTags = await db.query.tagsToMediaItems.findMany({
			where: eq(tagsToMediaItems.mediaItemId, parsedId)
		});
		const allTags = (await db.query.tags.findMany()) as TagSchema[];
		const finalTags = [];
		const nextMediaItem = await db.query.mediaItems.findFirst({
			where: gt(mediaItems.id, parsedId)
		});
		const previousMediaItem = await db.query.mediaItems.findFirst({
			where: lt(mediaItems.id, parsedId),
			orderBy: (tb, { desc }) => [desc(tb.id)]
		});
	
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
	} else {
		return reply.status(404).send({ message: 'Media item not found'});
	}
};

export default {
	method: 'GET',
	url: '/mediaItems/:id',
	handler: getMediaItem,
	onRequest: checkVault
} as RouteOptions;
