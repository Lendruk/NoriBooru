import { eq } from 'drizzle-orm';
import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import fs from 'fs/promises';
import { masterDb } from '../../../db/master/db';
import { vaults } from '../../../db/master/schema';
const deleteVault = async (request: FastifyRequest, reply: FastifyReply) => {
	const params = request.params as { id: string };

	const vaultPath = (await masterDb.query.vaults.findFirst({ where: eq(vaults.id, params.id) }))
		?.path;

	if (vaultPath) {
		await fs.rm(vaultPath, { recursive: true, force: true });
		await masterDb.delete(vaults).where(eq(vaults.id, params.id));
	}
	return reply.send({ message: 'Vault deleted successfully' });
};

export default {
	method: 'DELETE',
	url: '/vaults/:id',
	handler: deleteVault
} as RouteOptions;
