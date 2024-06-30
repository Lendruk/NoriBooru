import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import {  TagSchema, tags, tagsToMediaItems } from '../../db/vault/schema';
import { and, eq } from 'drizzle-orm';
import { checkVault } from '../../hooks/checkVault';

const removeTagFromMediaItem = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if(!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { id } = request.params as { id: string };
	const body = request.body as TagSchema;
	const { db } = vault;
	try {
		if (id) {
			await db.delete(tagsToMediaItems).where(and(eq(tagsToMediaItems.tagId, body.id), eq(tagsToMediaItems.mediaItemId, Number.parseInt(id))));
			await db.update(tags).set({ mediaCount: body.mediaCount - 1 }).where(eq(tags.id, body.id));
		}
	} catch(error) {
		return reply.status(400).send({ message: error });
	}

	return reply.send({ message: 'Tag removed successfully' });
};

export default {
	method: 'DELETE',
	url: '/mediaItems/:id/tags',
	handler: removeTagFromMediaItem,
	onRequest: checkVault,
} as RouteOptions;