import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import path from 'path';
import { masterDb } from '../../db/master/db';
import { getServerConfig } from '../../utils/getServerConfig';

const getVaults = async (_: FastifyRequest, reply: FastifyReply) => {
	const vaults = await masterDb.query.vaults.findMany();
	const relativeVaultDirPath = (await getServerConfig()).baseVaultDir;
	const absoluteVaultDirPath = path.join(process.cwd(), relativeVaultDirPath);
	return reply.send({
		vaults: vaults.map((vault) => ({
			...vault,
			hasInstalledSD: vault.hasInstalledSD === 1 ? true : false
		})),
		baseVaultDir: absoluteVaultDirPath
	});
};

export default {
	method: 'GET',
	url: '/vaults',
	handler: getVaults
} as RouteOptions;
