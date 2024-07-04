import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import path from 'path';
import * as fs from 'fs/promises';
import { VaultController } from '../../db/VaultController';

const getImageThumbnail = async (request: FastifyRequest, reply: FastifyReply) => {
	const params = request.params as { fileName: string; vaultId: string };

	const vaultId = params.vaultId;
	if (!vaultId) {
		return reply.status(400).send('Vault ID is required');
	}

	const fileName = params.fileName;
	const vault = VaultController.getVault(vaultId);

	const imagePath = path.join(vault.path, 'media', 'images', '.thumb', `${fileName}`);
	const image = await fs.readFile(imagePath);

	return reply.header('Content-Type', 'image/jpg').send(image);
};

export default {
	method: 'GET',
	url: '/images/:vaultId/thumb/:fileName',
	handler: getImageThumbnail
} as RouteOptions;
