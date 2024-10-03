import { eq } from 'drizzle-orm';
import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import fs from 'fs/promises';
import path from 'path';
import { masterDb } from '../../../db/master/db';
import { vaults } from '../../../db/master/schema';
import { VaultConfig } from '../../../types/VaultConfig';
import { getServerConfig } from '../../../utils/getServerConfig';

const getVaults = async (_: FastifyRequest, reply: FastifyReply) => {
	const fetchedVaults = await masterDb.query.vaults.findMany();
	const relativeVaultDirPath = (await getServerConfig()).baseVaultDir;
	const absoluteVaultDirPath = path.join(process.cwd(), relativeVaultDirPath);

	const vaultsWithConfig: VaultConfig[] = [];
	for (const vault of fetchedVaults) {
		try {
			const vaultData = JSON.parse(
				(await fs.readFile(`${vault.path}/vault.config.json`)).toString()
			) as VaultConfig;
			vaultsWithConfig.push(vaultData);
		} catch {
			// No vault config - prune unexistent vault
			await masterDb.delete(vaults).where(eq(vaults.id, vault.id));
		}
	}
	return reply.send({
		vaults: vaultsWithConfig,
		baseVaultDir: absoluteVaultDirPath
	});
};

export default {
	method: 'GET',
	url: '/vaults',
	handler: getVaults
} as RouteOptions;
