import { eq } from 'drizzle-orm';
import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import fs from 'fs/promises';
import { masterDb } from '../../db/master/db';
import { vaults } from '../../db/master/schema';
import { VaultController } from '../../db/VaultController';
import { VaultConfig } from '../../types/VaultConfig';

const importVault = async (request: FastifyRequest, reply: FastifyReply) => {
	const body = request.body as { path: string };
	const vault = await masterDb.query.vaults.findFirst({
		where: eq(vaults.path, body.path)
	});

	if (!vault) {
		let vaultData: VaultConfig;
		try {
			const rawVaultData = (await fs.readFile(`${body.path}/vault.config.json`)).toString();
			vaultData = JSON.parse(rawVaultData) as VaultConfig;
		} catch {
			return reply.status(400).send({ message: 'Path is not a valid vault' });
		}

		await masterDb.insert(vaults).values(vaultData);
		await VaultController.registerVault(vaultData);
		return reply.send(vaultData);
	} else {
		return reply.status(400).send({ message: 'Vault already exists' });
	}
};

export default {
	method: 'POST',
	url: '/vaults/import',
	handler: importVault
} as RouteOptions;
