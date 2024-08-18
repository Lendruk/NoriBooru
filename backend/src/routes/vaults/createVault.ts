import { randomUUID } from 'crypto';
import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import * as fs from 'fs/promises';
import { masterDb } from '../../db/master/db';
import { vaults } from '../../db/master/schema';
import { VaultController } from '../../db/VaultController';
import { VaultConfig } from '../../types/VaultConfig';
import { getServerConfig } from '../../utils/getServerConfig';

const createVault = async (request: FastifyRequest, reply: FastifyReply) => {
	const body = request.body as { path?: string; name: string };

	const vaultPath = body.path as string;

	if (vaultPath) {
		try {
			const stats = await fs.stat(vaultPath);
			if (!stats.isDirectory()) {
				return reply.status(400).send({ message: 'Path is not a directory' });
			}

			const dirContent = await fs.readdir(vaultPath);
			if (dirContent.length > 0) {
				return reply.status(400).send({ message: 'Directory must be empty' });
			}
		} catch (err) {
			await fs.mkdir(vaultPath);
		}
	}

	const newVault = await masterDb
		.insert(vaults)
		.values({
			id: randomUUID(),
			path: body.path ?? (await getServerConfig()).baseVaultDir
		})
		.returning();

	await fs.mkdir(`${vaultPath}/media`);
	await fs.mkdir(`${vaultPath}/media/images`);
	await fs.mkdir(`${vaultPath}/media/images/.thumb`);
	await fs.mkdir(`${vaultPath}/media/videos`);
	await fs.mkdir(`${vaultPath}/media/videos/.thumb`);

	const vaultConfig: VaultConfig = {
		id: newVault[0].id,
		name: body.name,
		path: vaultPath,
		createdAt: Date.now(),
		version: process.env.npm_package_version ?? 'unknown',
		hasInstalledSD: false,
		civitaiApiKey: null
	};
	await fs.writeFile(`${vaultPath}/vault.config.json`, JSON.stringify(vaultConfig, null, 2));
	await VaultController.registerVault(newVault[0]);
	return reply.send(vaultConfig);
};

export default {
	method: 'POST',
	url: '/vaults',
	handler: createVault
} as RouteOptions;
