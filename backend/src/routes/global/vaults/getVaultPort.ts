import { eq } from 'drizzle-orm';
import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { masterDb } from '../../../db/master/db';
import { vaults } from '../../../db/master/schema';
import { VaultController } from '../../../db/VaultController';

const getVaultPort = async (request: FastifyRequest, reply: FastifyReply) => {
	const { id } = request.params as { id: string };

	let port: number | undefined;
	if (!VaultController.vaults.has(id)) {
		const vault = await masterDb.query.vaults.findFirst({
			where: eq(vaults.id, id)
		});

		if (!vault) {
			return reply.status(404).send({ message: 'Vault not found' });
		}
		const api = await VaultController.registerVault(vault);
		port = api.getPort();
	} else {
		port = VaultController.vaults.get(id)?.getPort();
	}

	return reply.send({ port });
};

export default {
	method: 'GET',
	url: '/vault/:id/port',
	handler: getVaultPort
} as RouteOptions;
