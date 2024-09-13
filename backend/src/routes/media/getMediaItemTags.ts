import { eq } from 'drizzle-orm';
import { FastifyReply, RouteOptions } from 'fastify';
import { tags, tagsToMediaItems } from '../../db/vault/schema';
import { checkVault } from '../../hooks/checkVault';
import { Request } from '../../types/Request';

const getMediaItemTags = async (request: Request, reply: FastifyReply) => {
	const vaultInstance = request.vault;
	if (!vaultInstance) {
		return reply.status(400).send('No vault provided');
	}

	const { db } = vaultInstance;
	const { id } = request.params as { id: string };
	const parsedId = Number.parseInt(id);
	const mediaTags = await db.query.tagsToMediaItems.findMany({
		where: eq(tagsToMediaItems.mediaItemId, parsedId)
	});
	const finalTags = [];

	for (const mediaTag of mediaTags) {
		const tag = await db.query.tags.findFirst({
			where: eq(tags.id, mediaTag.tagId)
		});
		finalTags.push(tag);
	}

	return reply.send(finalTags);
};

export default {
	method: 'GET',
	url: '/media-items/:id/tags',
	handler: getMediaItemTags,
	onRequest: checkVault
} as RouteOptions;
