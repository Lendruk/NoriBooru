import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { playlists, playlists_mediaItems_table } from '../../db/vault/schema';
import { checkVault } from '../../hooks/checkVault';

type RequestBody = {
	name: string;
	randomizeOrder: boolean;
	timePerItem: number;
	items: number[];
};

const createPlaylist = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { db } = vault;
	const body = request.body as RequestBody;
	const playlist = (
		await db
			.insert(playlists)
			.values({
				name: body.name,
				createdAt: Date.now(),
				randomizeOrder: body.randomizeOrder ? 1 : 0,
				timePerItem: body.timePerItem
			})
			.returning()
	)[0];

	let items: { playlistId: number; mediaItemId: number; itemIndex: number }[] = [];
	if (body.items.length > 0) {
		items = await db
			.insert(playlists_mediaItems_table)
			.values(
				body.items.map((item, index) => ({
					playlistId: playlist.id,
					mediaItemId: item,
					itemIndex: index
				}))
			)
			.returning();
	}
	return reply.send({ ...playlist, items });
};

export default {
	method: 'POST',
	url: '/playlists',
	handler: createPlaylist,
	onRequest: checkVault
} as RouteOptions;
