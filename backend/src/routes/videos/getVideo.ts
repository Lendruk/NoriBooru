import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { VaultController } from '../../db/VaultController';

const getVideo = async (request: FastifyRequest, reply: FastifyReply) => {
	const params = request.params as { vaultId: string; fileName: string };
	const vaultId = params.vaultId;
	if (!vaultId) {
		return reply.status(400).send('Vault ID is required');
	}

	const fileName = params.fileName;
	const vault = VaultController.getVault(vaultId);
	const videoPath = path.join(vault.path, 'media', 'videos', fileName!);

	const stats = await fs.stat(videoPath);

	const range = request.headers.range;
	if (!range) {
		// 416 Wrong range
		return reply.status(416).send();
	}

	const positions = range.replace(/bytes=/, '').split('-');
	const start = parseInt(positions[0], 10);
	const total = stats.size;
	const end = positions[1] ? parseInt(positions[1], 10) : total - 1;
	const chunksize = end - start + 1;

	const videoStream = createReadStream(videoPath, { start, end: end === total - 1 ? total : end });
	return reply
		.code(206)
		.header('Content-Range', `bytes ${start}-${end}/${total}`)
		.header('Content-Length', chunksize)
		.header('Content-Type', `video/${videoPath.split('.').pop()!}`)
		.header('accept-ranges', 'bytes')
		.send(videoStream);
};

export default {
	method: 'GET',
	url: '/videos/:vaultId/:fileName',
	handler: getVideo
} as RouteOptions;
