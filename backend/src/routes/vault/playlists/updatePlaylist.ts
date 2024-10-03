import { eq } from 'drizzle-orm';
import { FastifyReply, RouteOptions } from 'fastify';
import { playlists, playlists_mediaItems_table } from '../../../db/vault/schema';
import { checkVault } from '../../../hooks/checkVault';
import { VaultRequest } from '../../../types/Request';

const updatePlaylist = async (request: VaultRequest, reply: FastifyReply) => {
	const vault = request.vault;
	const params = request.params as { id: string };
	const body = request.body as {
		name: string;
		randomizeOrder: boolean;
		timePerItem: number;
		items: number[];
	};

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	if (!params.id) {
		return reply.status(400).send({ message: 'Missing id' });
	}
	const { db } = vault;

	const id = parseInt(params.id);
	// This is inefficient improve in future
	await db.delete(playlists_mediaItems_table).where(eq(playlists_mediaItems_table.playlistId, id));
	await db
		.update(playlists)
		.set({
			name: body.name,
			randomizeOrder: body.randomizeOrder ? 1 : 0,
			timePerItem: body.timePerItem
		})
		.where(eq(playlists.id, id));
	await db
		.insert(playlists_mediaItems_table)
		.values(
			body.items.map((item, index) => ({
				playlistId: id,
				mediaItemId: item,
				itemIndex: index
			}))
		)
		.returning();
	return reply.send({ message: 'Playlist updated successfully' });
};

export default {
	method: 'PUT',
	url: '/playlists/:id',
	handler: updatePlaylist,
	onRequest: checkVault
} as RouteOptions;
