import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../../types/Request';
import { checkVault } from '../../../hooks/checkVault';
import { sdLoras, tagsToLoras } from '../../../db/vault/schema';
import { eq, sql } from 'drizzle-orm';

const updateLora = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	const { id } = request.params as { id: string };
	const body = request.body as { name: string, tags: number[], previewImage?: string };
	if(!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { db } = vault;
	await db.update(sdLoras)
		.set({ previewImage: body.previewImage, name: body.name })
		.where(eq(sdLoras.id, id));
	const currentTags = (await db.query.tagsToLoras.findMany({ where: eq(tagsToLoras.loraId, id)})).map(({ tagId }) => tagId);
	const tagsToRemove: number[] = [];
	const tagsToAdd: number[] = [];

	for(const tagId of currentTags) {
		if (!body.tags.find(tag => tagId === tag)) {
			tagsToRemove.push(tagId);
		}
	}

	for(const tagId of body.tags) {
		if(!currentTags.find(tag => tagId === tag)) {
			tagsToAdd.push(tagId);
		}
	}

	if (tagsToRemove.length > 0) {
		await db.delete(tagsToLoras).where(sql`${tagsToLoras.tagId} in (${tagsToRemove.join(',')})`);
	}

	if (tagsToAdd.length > 0) {
		await db.insert(tagsToLoras).values(tagsToAdd.map((tag) => ({ loraId: id, tagId: tag })));
	}

	reply.send();
};

export default {
	method: 'PUT',
	url: '/sd/loras/:id',
	handler: updateLora,
	onRequest: checkVault,
} as RouteOptions;