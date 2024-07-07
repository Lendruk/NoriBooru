import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { checkVault } from '../../hooks/checkVault';
import { mediaItems } from '../../db/vault/schema';
import { eq } from 'drizzle-orm';

const getMediaToReview = async (request: Request, reply: FastifyReply) => {
	const vaultInstance = request.vault;

	if (!vaultInstance) {
		return reply.status(400).send('No vault provided');
	}

	const { db } = vaultInstance;

	const inboxIds = await db
		.select({ id: mediaItems.id })
		.from(mediaItems)
		.where(eq(mediaItems.isArchived, 0));

	return reply.send(inboxIds.map(({ id }) => id));
};

export default {
	method: 'GET',
	url: '/mediaItems/review',
	handler: getMediaToReview,
	onRequest: checkVault
} as RouteOptions;
