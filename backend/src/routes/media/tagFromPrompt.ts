import { eq } from 'drizzle-orm';
import { FastifyReply, RouteOptions } from 'fastify';
import { mediaItemsMetadata } from '../../db/vault/schema';
import { checkVault } from '../../hooks/checkVault';
import { mediaService } from '../../services/MediaService';
import { Request } from '../../types/Request';

const tagFromPrompt = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { id: rawId } = request.params as { id: string };

	try {
		const id = Number.parseInt(rawId);
		const { db } = vault;
		const metadata = await db.query.mediaItemsMetadata.findFirst({
			where: eq(mediaItemsMetadata.mediaItem, id)
		});
		if (metadata?.positivePrompt) {
			await mediaService.tagMediaItemFromPrompt(vault, [id], metadata.positivePrompt);
		}
	} catch (error) {
		return reply.status(400).send({ message: error });
	}

	return reply.send({ message: 'Tag added successfully' });
};

export default {
	method: 'PATCH',
	url: '/mediaItems/:id/auto-tag',
	handler: tagFromPrompt,
	onRequest: checkVault
} as RouteOptions;
