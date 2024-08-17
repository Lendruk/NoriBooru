import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import fs from 'fs/promises';
import path from 'path';
import { masterDb } from '../../db/master/db';
import { VaultConfig } from '../../types/VaultConfig';
import { getServerConfig } from '../../utils/getServerConfig';

const getVaults = async (_: FastifyRequest, reply: FastifyReply) => {
	const vaults = await masterDb.query.vaults.findMany();
	const relativeVaultDirPath = (await getServerConfig()).baseVaultDir;
	const absoluteVaultDirPath = path.join(process.cwd(), relativeVaultDirPath);

	const vaultsWithConfig: VaultConfig[] = [];
	for (const vault of vaults) {
		const vaultData = JSON.parse(
			(await fs.readFile(`${vault.path}/vault.config.json`)).toString()
		) as VaultConfig;
		vaultsWithConfig.push(vaultData);
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
