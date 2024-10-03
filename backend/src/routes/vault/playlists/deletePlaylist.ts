import { eq } from 'drizzle-orm';
import { FastifyReply, RouteOptions } from 'fastify';
import { playlists, playlists_mediaItems_table } from '../../db/vault/schema';
import { checkVault } from '../../hooks/checkVault';
import { VaultRequest } from '../../types/Request';

const deletePlaylist = async (request: VaultRequest, reply: FastifyReply) => {
	const vault = request.vault;
	const params = request.params as { id: string };

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	if (!params.id) {
		return reply.status(400).send({ message: 'Missing id' });
	}

	const { db } = vault;
	const id = parseInt(params.id);
	await db.delete(playlists_mediaItems_table).where(eq(playlists_mediaItems_table.playlistId, id));
	await db.delete(playlists).where(eq(playlists.id, id));
	return reply.send();
};

export default {
	method: 'DELETE',
	url: '/playlists/:id',
	handler: deletePlaylist,
	onRequest: checkVault
} as RouteOptions;
