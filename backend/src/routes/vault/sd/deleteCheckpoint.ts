import { eq } from 'drizzle-orm';
import { FastifyReply, RouteOptions } from 'fastify';
import fs from 'fs/promises';
import { sdCheckpoints } from '../../../db/vault/schema';
import { checkVault } from '../../../hooks/checkVault';
import { VaultRequest } from '../../../types/Request';

const deleteCheckpoint = async (request: VaultRequest, reply: FastifyReply) => {
	const vault = request.vault;
	const { id } = request.params as { id: string };
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { db } = vault;
	const checkpoint = await db.query.sdCheckpoints.findFirst({ where: eq(sdCheckpoints.id, id) });
	if (checkpoint) {
		await fs.unlink(checkpoint.path);
	}

	await db.delete(sdCheckpoints).where(eq(sdCheckpoints.id, id));
	reply.send({ message: 'Checkpoint deleted successfully' });
};

export default {
	method: 'DELETE',
	url: '/sd/checkpoints/:id',
	handler: deleteCheckpoint,
	onRequest: checkVault
} as RouteOptions;
