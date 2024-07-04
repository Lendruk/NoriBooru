import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { eq, sql } from 'drizzle-orm';
import { playlists_mediaItems_table } from '../../db/vault/schema';
import { checkVault } from '../../hooks/checkVault';

export type SimplePlaylist = {
	id: number;
	name: string;
	createdAt: number;
	updatedAt: number | null;
	randomizeOrder: number;
	timePerItem: number | null;
	items: number;
};

const getPlaylists = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}
	const { db } = vault;

	const playlists = (await db.query.playlists.findMany()) as SimplePlaylist[];

	for (const playlist of playlists) {
		const amtOfMedia = await db
			.select({
				count: sql<number>`cast(count(${playlists_mediaItems_table.playlistId}) as int)`
			})
			.from(playlists_mediaItems_table)
			.where(eq(playlists_mediaItems_table.playlistId, playlist.id));
		playlist.items = amtOfMedia[0].count;
	}
	return reply.send(playlists);
};

export default {
	method: 'GET',
	url: '/playlists',
	handler: getPlaylists,
	onRequest: checkVault
} as RouteOptions;
