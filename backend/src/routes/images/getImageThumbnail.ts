import { eq } from 'drizzle-orm';
import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import * as fs from 'fs/promises';
import path from 'path';
import { VaultController } from '../../db/VaultController';
import { mediaItems } from '../../db/vault/schema';
import { mediaService } from '../../services/MediaService';

const getImageThumbnail = async (request: FastifyRequest, reply: FastifyReply) => {
	const params = request.params as { fileName: string; vaultId: string };

	const vaultId = params.vaultId;
	if (!vaultId) {
		return reply.status(400).send('Vault ID is required');
	}

	const fileName = params.fileName;
	const vault = VaultController.getVault(vaultId);

	const thumbnailPath = path.join(vault.path, 'media', 'images', '.thumb', `${fileName}`);

	let image: Buffer | undefined;
	try {
		image = await fs.readFile(thumbnailPath);
	} catch (error) {
		if ((error as { code: string }).code === 'ENOENT') {
			const item = await vault.db.query.mediaItems.findFirst({
				where: eq(mediaItems.fileName, fileName.split('.')[0])
			});

			if (item) {
				const filePath = path.join(
					vault.path,
					'media',
					'images',
					`${item.fileName}.${item.extension}`
				);
				await mediaService.generateItemThumbnail(vault, item.extension, filePath, item);
				image = await fs.readFile(thumbnailPath);
			}
		}
	}

	if (!image) {
		return reply.status(404).send();
	} else {
		return reply.header('Content-Type', 'image/jpg').send(image);
	}
};

export default {
	method: 'GET',
	url: '/images/:vaultId/thumb/:fileName',
	handler: getImageThumbnail
} as RouteOptions;
