import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { masterDb } from '../../db/master/db';
import * as fs from 'fs/promises';
import { vaults } from '../../db/master/schema';
import { randomUUID } from 'crypto';
import { VaultController } from '../../db/VaultController';

const createVault = async (request: FastifyRequest, reply: FastifyReply) => {
	const body = request.body as { path: string; name: string };

	const vaultPath = body.path as string;

	try {
		const stats = await fs.stat(vaultPath);
  
		if (!stats.isDirectory()) {
			throw new Error('Path is not a directory');
		}
	} catch (err) {
		console.log(err);
		return reply.status(400).send({ message: 'Path is not a directory' });
	}

	const newVault = await masterDb.insert(vaults).values({ id: randomUUID(),  path: body.path, name: body.name }).returning();
  
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
	handler: createVault,
} as RouteOptions;