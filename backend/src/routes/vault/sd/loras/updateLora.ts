import { eq, sql } from 'drizzle-orm';
import { FastifyReply, RouteOptions } from 'fastify';
import { sdLoras, tagsToLoras } from '../../../db/vault/schema';
import { checkVault } from '../../../hooks/checkVault';
import { VaultRequest } from '../../../types/Request';

const updateLora = async (request: VaultRequest, reply: FastifyReply) => {
	const vault = request.vault;
	const { id } = request.params as { id: string };
	const body = request.body as {
		name?: string;
		tags?: number[];
		description?: string;
		sdVersion?: string;
		origin?: string;
		previewImage?: string;
	};
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const updatePayload: Record<string, unknown> = {};

	for (const key in body) {
		if (['name', 'previewImage', 'origin', 'description', 'sdVersion'].includes(key)) {
			updatePayload[key] = body[key as keyof typeof body];
		}
	}

	const { db } = vault;
	if (Object.keys(updatePayload).length > 0) {
		await db
			.update(sdLoras)
			.set({ ...updatePayload })
			.where(eq(sdLoras.id, id));
	}
	const currentTags = (
		await db.query.tagsToLoras.findMany({ where: eq(tagsToLoras.loraId, id) })
	).map(({ tagId }) => tagId);
	const tagsToRemove: number[] = [];
	const tagsToAdd: number[] = [];

	if (body.tags !== undefined && Array.isArray(body.tags)) {
		for (const tagId of currentTags) {
			if (!body.tags.find((tag) => tagId === tag)) {
				tagsToRemove.push(tagId);
			}
		}

		for (const tagId of body.tags) {
			if (!currentTags.find((tag) => tagId === tag)) {
				tagsToAdd.push(tagId);
			}
		}

		if (tagsToRemove.length > 0) {
			await db.delete(tagsToLoras).where(sql`${tagsToLoras.tagId} in (${tagsToRemove.join(',')})`);
		}

		if (tagsToAdd.length > 0) {
			console.log(tagsToAdd);
			await db.insert(tagsToLoras).values(tagsToAdd.map((tag) => ({ loraId: id, tagId: tag })));
		}
	}

	reply.send({ message: 'Lora updated successfully!' });
};

export default {
	method: 'PUT',
	url: '/sd/loras/:id',
	handler: updateLora,
	onRequest: checkVault
} as RouteOptions;
