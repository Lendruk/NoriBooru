import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import {  TagTableSchema, tags, tagsToMediaItems } from '../../db/vault/schema';
import { eq } from 'drizzle-orm';
import { checkVault } from '../../hooks/checkVault';
import { VaultDb } from '../../db/VaultController';

const insertTagIntoMedia = async (db: VaultDb , mediaId: number, tag: TagTableSchema): Promise<boolean> => {
	try {
		await db.insert(tagsToMediaItems).values({ tagId: tag.id, mediaItemId: mediaId });
		return true;
	} catch {
		return false;
	}
};

const addTagToMediaItems = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if(!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { ids } = request.params as { ids: string };
	const parsedIdArray: string[] = JSON.parse(ids);
	const body = request.body as TagTableSchema | { tags: TagTableSchema[] };
  
	try {
		const { db } = vault;
		if (parsedIdArray && Array.isArray(parsedIdArray)) {
			let tagsToInsert: TagTableSchema[] = [];
			if ('tags' in body) {
				tagsToInsert = body.tags;
			} else { 
				tagsToInsert = [body];
			}

			for(const tag of tagsToInsert) {
				let curMediaCount = tag.mediaCount;
				for (const id of parsedIdArray) {
					const numericId = Number.parseInt(id);
					if (await insertTagIntoMedia(db, numericId, tag)) {
						curMediaCount++;
						await db.update(tags).set({ mediaCount: curMediaCount }).where(eq(tags.id, tag.id));
					}
				}
			}
		}
	} catch(error) {
		return reply.status(400).send({ message: error });
	}

	return reply.send({ message: 'Tag added successfully' });
};

export default {
	method: 'PUT',
	url: '/mediaItems/:ids/tags',
	handler: addTagToMediaItems,
	onRequest: checkVault,
} as RouteOptions;