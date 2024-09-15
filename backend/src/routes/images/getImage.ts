import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import * as fs from 'fs/promises';
import path from 'path';
import { VaultController } from '../../db/VaultController';

const getImage = async (request: FastifyRequest, reply: FastifyReply) => {
	const params = request.params as { fileName: string; vaultId: string };

	const vaultId = params.vaultId;
	if (!vaultId) {
		return reply.status(400).send('Vault ID is required');
	}

	const fileName = params.fileName;
	const vault = VaultController.getVault(vaultId);
	const imagePath = path.join(vault.config.path, 'media', 'images', `${fileName}`);
	const image = await fs.readFile(imagePath);

	return reply.header('Content-Type', 'image/jpg').send(image);
};

export default {
	method: 'GET',
	url: '/images/:vaultId/:fileName',
	handler: getImage
} as RouteOptions;
