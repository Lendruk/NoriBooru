import { eq } from 'drizzle-orm';
import { FastifyReply, RouteOptions } from 'fastify';
import { sdCheckpoints } from '../../../db/vault/schema';
import { checkVault } from '../../../hooks/checkVault';
import { VaultRequest } from '../../../types/Request';

const updateCheckpoint = async (request: VaultRequest, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { id } = request.params as { id: string };
	const body = request.body as {
		name?: string;
		tags?: number[];
		sdVersion?: string;
		description?: string;
		origin?: string;
		previewImage?: string;
	};

	const updatePayload: Record<string, unknown> = {};
	for (const key in body) {
		if (['name', 'previewImage', 'origin', 'description', 'sdVersion'].includes(key)) {
			updatePayload[key] = body[key as keyof typeof body];
		}

		const { db } = vault;
		if (Object.keys(updatePayload).length > 0) {
			await db
				.update(sdCheckpoints)
				.set({ ...updatePayload })
				.where(eq(sdCheckpoints.id, id));
		}
	}
};

export default {
	method: 'PUT',
	url: '/sd/checkpoints/:id',
	handler: updateCheckpoint,
	onRequest: checkVault
} as RouteOptions;
