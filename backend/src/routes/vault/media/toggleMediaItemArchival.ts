import { eq } from 'drizzle-orm';
import { FastifyReply, RouteOptions } from 'fastify';
import { mediaItems } from '../../../db/vault/schema';
import { checkVault } from '../../../hooks/checkVault';
import { VaultRequest } from '../../../types/Request';

const toggleMediaItemArchival = async (request: VaultRequest, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { ids } = request.params as { ids: string };
	const parsedIdArray: string[] = JSON.parse(ids);
	const body = request.body as { isArchived: boolean };
	const { db } = vault;
	try {
		for (const rawId of parsedIdArray) {
			const parsedId = Number.parseInt(rawId ?? '');
			await db
				.update(mediaItems)
				.set({ isArchived: body.isArchived ? 1 : 0 })
				.where(eq(mediaItems.id, parsedId));
		}
	} catch (error) {
		console.log(error);
		return reply.status(400).send(error);
	}

	return reply.send({ message: 'Item archival status switched' });
};

export default {
	method: 'PATCH',
	url: '/media-items/:ids',
	handler: toggleMediaItemArchival,
	onRequest: checkVault
} as RouteOptions;
