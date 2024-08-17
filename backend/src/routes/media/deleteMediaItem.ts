import { eq } from 'drizzle-orm';
import { FastifyReply, RouteOptions } from 'fastify';
import * as fs from 'fs/promises';
import path from 'path';
import {
	mediaItems,
	playlists_mediaItems_table,
	tags,
	tagsToMediaItems
} from '../../db/vault/schema';
import { checkVault } from '../../hooks/checkVault';
import { Request } from '../../types/Request';

const deleteMediaItem = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { ids } = request.params as { ids: string };
	const parsedIdArray: string[] = JSON.parse(ids);
	const { db } = vault;
	try {
		for (const rawId of parsedIdArray) {
			const parsedId = Number.parseInt(rawId ?? '');
			if (parsedId) {
				const mediaItem = await db.query.mediaItems.findFirst({
					where: eq(mediaItems.id, parsedId)
				});
				if (mediaItem) {
					const mediaTags = await db.query.tagsToMediaItems.findMany({
						where: eq(tagsToMediaItems.mediaItemId, parsedId)
					});
					for (const mediaTag of mediaTags) {
						const tag = await db.query.tags.findFirst({
							where: eq(tags.id, mediaTag.tagId)
						});
						console.log(tag);
					}
					await db.delete(tagsToMediaItems).where(eq(tagsToMediaItems.mediaItemId, parsedId));
					await db.delete(mediaItems).where(eq(mediaItems.id, parsedId));
					await db
						.delete(playlists_mediaItems_table)
						.where(eq(playlists_mediaItems_table.mediaItemId, parsedId));
					// Delete the file
					try {
						await Promise.all([
							fs.unlink(
								path.join(
									vault.path,
									'media',
									mediaItem.type + 's',
									`${mediaItem.fileName}.${mediaItem.extension}`
								)
							),
							fs.unlink(
								path.join(
									vault.path,
									'media',
									mediaItem.type + 's',
									'.thumb',
									`${mediaItem.fileName}.${mediaItem.type === 'video' ? 'mp4' : 'jpg'}`
								)
							)
						]);
					} catch (error) {
						// TODO - Add fall back for error in file deletion
					}
				}
			}
		}
	} catch (error) {
		console.log(error);
		return reply.status(400).send({ message: error });
	}

	return reply.send({ message: 'Media item deleted successfully' });
};

export default {
	method: 'DELETE',
	url: '/mediaItems/:ids',
	handler: deleteMediaItem,
	onRequest: checkVault
} as RouteOptions;
