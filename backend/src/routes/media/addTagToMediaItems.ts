import { FastifyReply, RouteOptions } from 'fastify';
import { TagSchema } from '../../db/vault/schema';
import { checkVault } from '../../hooks/checkVault';
import { mediaService } from '../../services/MediaService';
import { Request } from '../../types/Request';

const addTagToMediaItems = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { ids } = request.params as { ids: string };
	const parsedIdArray: string[] = JSON.parse(ids);
	const body = request.body as TagSchema | { tags: TagSchema[] };

	try {
		if (parsedIdArray && Array.isArray(parsedIdArray)) {
			let tagsToInsert: TagSchema[] = [];
			if ('tags' in body) {
				tagsToInsert = body.tags;
			} else {
				tagsToInsert = [body];
			}

			for (const tag of tagsToInsert) {
				for (const id of parsedIdArray) {
					const parsedMediaId = Number.parseInt(id);
					await mediaService.addTagToMediaItem(vault, parsedMediaId, tag.id);
				}
			}
		}
	} catch (error) {
		return reply.status(400).send({ message: error });
	}

	return reply.send({ message: 'Tag added successfully' });
};

export default {
	method: 'PUT',
	url: '/media-items/:ids/tags',
	handler: addTagToMediaItems,
	onRequest: checkVault
} as RouteOptions;
