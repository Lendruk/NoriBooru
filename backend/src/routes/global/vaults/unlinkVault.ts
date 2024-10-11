import { eq } from 'drizzle-orm';
import { FastifyReply, RouteOptions } from 'fastify';
import { masterDb } from '../../../db/master/db';
import { vaults } from '../../../db/master/schema';
import { checkVault } from '../../../hooks/checkVault';
import { VaultRequest } from '../../../types/Request';

const unlinkVault = async (request: VaultRequest, reply: FastifyReply) => {
	const { vault } = request;

	if (!vault) {
		return reply.status(400).send('No vault provided');
	}
	const vaultPath = (
		await masterDb.query.vaults.findFirst({ where: eq(vaults.id, vault.getConfig().id) })
	)?.path;

	if (vaultPath) {
		await masterDb.delete(vaults).where(eq(vaults.id, vault.getConfig().id));
	}
	return reply.send({ message: 'Vault unlinked successfully' });
};

export default {
	method: 'POST',
	url: '/vaults/unlink',
	onRequest: checkVault,
	handler: unlinkVault
} as RouteOptions;
