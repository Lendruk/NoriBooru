import { eq } from 'drizzle-orm';
import { FastifyReply, RouteOptions } from 'fastify';
import { playlists_mediaItems_table } from '../../db/vault/schema';
import { checkVault } from '../../hooks/checkVault';
import { VaultRequest } from '../../types/Request';

export type SimplePlaylist = {
	id: number;
	name: string;
	createdAt: number;
	updatedAt: number | null;
	randomizeOrder: number;
	timePerItem: number | null;
	items: number[];
};

const getPlaylists = async (request: VaultRequest, reply: FastifyReply) => {
	const vault = request.vault;

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}
	const { db } = vault;

	const playlists = (await db.query.playlists.findMany()) as SimplePlaylist[];

	for (const playlist of playlists) {
		const itemIds = await db.query.playlists_mediaItems_table.findMany({
			where: eq(playlists_mediaItems_table.playlistId, playlist.id)
		});
		playlist.items = itemIds.map((item) => item.mediaItemId);
	}
	return reply.send(playlists);
};

export default {
	method: 'GET',
	url: '/playlists',
	handler: getPlaylists,
	onRequest: checkVault
} as RouteOptions;
