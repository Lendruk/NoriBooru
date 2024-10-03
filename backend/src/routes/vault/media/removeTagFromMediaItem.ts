import { and, eq } from 'drizzle-orm';
import { FastifyReply, RouteOptions } from 'fastify';
import { TagSchema, tagsToMediaItems } from '../../../db/vault/schema';
import { checkVault } from '../../../hooks/checkVault';
import { VaultRequest } from '../../../types/Request';

const removeTagFromMediaItem = async (request: VaultRequest, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { id } = request.params as { id: string };
	const body = request.body as TagSchema;
	const { db } = vault;
	try {
		if (id) {
			await db
				.delete(tagsToMediaItems)
				.where(
					and(
						eq(tagsToMediaItems.tagId, body.id),
						eq(tagsToMediaItems.mediaItemId, Number.parseInt(id))
					)
				);
		}
	} catch (error) {
		return reply.status(400).send({ message: error });
	}

	return reply.send({ message: 'Tag removed successfully' });
};

export default {
	method: 'DELETE',
	url: '/media-items/:id/tags',
	handler: removeTagFromMediaItem,
	onRequest: checkVault
} as RouteOptions;
