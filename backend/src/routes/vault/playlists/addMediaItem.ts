import { eq } from 'drizzle-orm';
import { FastifyReply, RouteOptions } from 'fastify';
import { playlists_mediaItems_table } from '../../../db/vault/schema';
import { checkVault } from '../../../hooks/checkVault';
import { VaultRequest } from '../../../types/Request';

const addMediaItem = async (request: VaultRequest, reply: FastifyReply) => {
	const vault = request.vault;
	const params = request.params as { id: string };
	const body = request.body as {
		item: number;
	};

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	if (!params.id) {
		return reply.status(400).send({ message: 'Missing id' });
	}
	const { db } = vault;

	const id = parseInt(params.id);
	// Get latest item index
	const latestItemIndex = await db.query.playlists_mediaItems_table.findFirst({
		where: eq(playlists_mediaItems_table.playlistId, id),
		orderBy: playlists_mediaItems_table.itemIndex
	});

	if (!latestItemIndex) {
		throw new Error('No items found in playlist');
	}

	await db
		.insert(playlists_mediaItems_table)
		.values({
			playlistId: id,
			mediaItemId: body.item,
			itemIndex: latestItemIndex.itemIndex + 1
		})
		.returning();
	return reply.send({ message: 'Playlist updated successfully' });
};

export default {
	method: 'PATCH',
	url: '/playlists/:id/add-item',
	handler: addMediaItem,
	onRequest: checkVault
} as RouteOptions;
