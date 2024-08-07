import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { VaultController } from '../../db/VaultController';
import { createReadStream } from 'fs';
import path from 'path';

const getVideo = async (request: FastifyRequest, reply: FastifyReply) => {
	const params = request.params as { vaultId: string; fileName: string };
	const vaultId = params.vaultId;
	if (!vaultId) {
		return reply.status(400).send('Vault ID is required');
	}

	const fileName = params.fileName;
	const vault = VaultController.getVault(vaultId);
	const videoPath = path.join(vault.path, 'media', 'videos', fileName!);
	const videoStream = createReadStream(videoPath);

	return reply.send(videoStream);
};

export default {
	method: 'GET',
	url: '/videos/:vaultId/:fileName',
	handler: getVideo
} as RouteOptions;
