import { eq } from 'drizzle-orm';
import { FastifyReply, RouteOptions } from 'fastify';
import { Playlist, mediaItems, playlists, playlists_mediaItems_table } from '../../db/vault/schema';
import { checkVault } from '../../hooks/checkVault';
import { VaultRequest } from '../../types/Request';

const getPlaylist = async (request: VaultRequest, reply: FastifyReply) => {
	const vault = request.vault;
	const params = request.params as { id: string };
	if (!params.id) {
		return reply.status(400).send({ message: 'Missing id' });
	}
	const id = parseInt(params.id);

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}
	const { db } = vault;
	const rows = await db
		.select({
			id: playlists.id,
			name: playlists.name,
			createdAt: playlists.createdAt,
			timePerItem: playlists.timePerItem,
			randomizeOrder: playlists.randomizeOrder,
			updatedAt: playlists.updatedAt,
			item: {
				id: mediaItems.id,
				fileName: mediaItems.fileName,
				type: mediaItems.type,
				extension: mediaItems.extension,
				fileSize: mediaItems.fileSize,
				sdCheckpoint: mediaItems.sdCheckpoint,
				createdAt: mediaItems.createdAt,
				updatedAt: mediaItems.updatedAt,
				isArchived: mediaItems.isArchived,
				hash: mediaItems.hash,
				originalFileName: mediaItems.originalFileName,
				index: playlists_mediaItems_table.itemIndex,
				source: mediaItems.source
			}
		})
		.from(playlists)
		.where(eq(playlists.id, id))
		.leftJoin(playlists_mediaItems_table, eq(playlists_mediaItems_table.playlistId, playlists.id))
		.leftJoin(mediaItems, eq(playlists_mediaItems_table.mediaItemId, mediaItems.id));

	const playlist = Object.values(
		rows.reduce<Record<number, Playlist>>((acc, row) => {
			const { createdAt, id, name, randomizeOrder, updatedAt, timePerItem, item } = row;

			if (!acc[id]) {
				acc[id] = {
					createdAt,
					id,
					timePerItem,
					name,
					randomizeOrder,
					updatedAt,
					items: []
				};
			}

			if (item) {
				acc[id].items![item.index!] = {
					createdAt: item.createdAt!,
					extension: item.extension!,
					fileSize: item.fileSize!,
					fileName: item.fileName!,
					id: item.id!,
					sdCheckpoint: item.sdCheckpoint,
					isArchived: item.isArchived ?? 0,
					type: item.type!,
					hash: item.hash!,
					updatedAt: item.updatedAt,
					originalFileName: item.originalFileName,
					source: item.source
				};
			}

			return acc;
		}, {})
	)[0];

	return reply.send(playlist);
};

export default {
	method: 'GET',
	url: '/playlists/:id',
	handler: getPlaylist,
	onRequest: checkVault
} as RouteOptions;
