import { randomUUID } from 'crypto';
import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import * as fs from 'fs/promises';
import { masterDb } from '../../db/master/db';
import { vaults } from '../../db/master/schema';
import { VaultController } from '../../db/VaultController';
import { getServerConfig } from '../../utils/getServerConfig';

const createVault = async (request: FastifyRequest, reply: FastifyReply) => {
	const body = request.body as { path?: string; name: string };

	const vaultPath = body.path as string;

	if (vaultPath) {
		try {
			const stats = await fs.stat(vaultPath);
			console.log(stats);
			if (!stats.isDirectory()) {
				return reply.status(400).send({ message: 'Path is not a directory' });
			}

			const dirContent = await fs.readdir(vaultPath);
			if (dirContent.length > 0) {
				return reply.status(400).send({ message: 'Directory must be empty' });
			}
		} catch (err) {
			console.log(err);
			await fs.mkdir(vaultPath);
		}
	}

	const newVault = await masterDb
		.insert(vaults)
		.values({
			id: randomUUID(),
			path: body.path ?? (await getServerConfig()).baseVaultDir,
			name: body.name
		})
		.returning();

	await fs.mkdir(`${vaultPath}/media`);
	await fs.mkdir(`${vaultPath}/media/images`);
	await fs.mkdir(`${vaultPath}/media/images/.thumb`);
	await fs.mkdir(`${vaultPath}/media/videos`);
	VaultController.registerVault(newVault[0]);
	return reply.send(newVault[0]);
};

export default {
	method: 'POST',
	url: '/vaults',
	handler: createVault
} as RouteOptions;
