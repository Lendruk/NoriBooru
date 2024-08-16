import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import * as fs from 'fs/promises';
import path from 'path';
import { VaultController } from '../../db/VaultController';

const getVideoThumbnail = async (request: FastifyRequest, reply: FastifyReply) => {
	const params = request.params as { fileName: string; vaultId: string };

	const vaultId = params.vaultId;
	if (!vaultId) {
		return reply.status(400).send('Vault ID is required');
	}

	const fileName = params.fileName;
	const vault = VaultController.getVault(vaultId);

	const videoPath = path.join(vault.path, 'media', 'videos', '.thumb', `${fileName}`);
	const video = await fs.readFile(videoPath);

	return reply.header('Content-Type', 'image/mp4').send(video);
};

export default {
	method: 'GET',
	url: '/videos/:vaultId/thumb/:fileName',
	handler: getVideoThumbnail
} as RouteOptions;
