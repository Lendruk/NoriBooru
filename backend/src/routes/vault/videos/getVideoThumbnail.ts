import { eq } from 'drizzle-orm';
import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import * as fs from 'fs/promises';
import path from 'path';
import { mediaItems } from '../../../db/vault/schema';
import { VaultController } from '../../../db/VaultController';

const getVideoThumbnail = async (request: FastifyRequest, reply: FastifyReply) => {
	const params = request.params as { fileName: string; vaultId: string };

	const vaultId = params.vaultId;
	if (!vaultId) {
		return reply.status(400).send('Vault ID is required');
	}

	const fileName = params.fileName;
	const vault = VaultController.getVault(vaultId);

	const thumbnailPath = path.join(vault.config.path, 'media', 'videos', '.thumb', `${fileName}`);
	let video: Buffer | undefined;
	try {
		video = await fs.readFile(thumbnailPath);
	} catch (error) {
		if ((error as { code: string }).code === 'ENOENT') {
			const item = await vault.db.query.mediaItems.findFirst({
				where: eq(mediaItems.fileName, fileName.split('.')[0])
			});

			if (item) {
				const filePath = path.join(
					vault.config.path,
					'media',
					'videos',
					`${item.fileName}.${item.extension}`
				);
				await vault.media.generateItemThumbnail(item.extension, filePath, item);
				video = await fs.readFile(thumbnailPath);
			}
		}
	}

	if (!video) {
		return reply.status(404).send();
	} else {
		return reply.header('Content-Type', 'image/mp4').send(video);
	}
};

export default {
	method: 'GET',
	url: '/videos/:vaultId/thumb/:fileName',
	handler: getVideoThumbnail
} as RouteOptions;
