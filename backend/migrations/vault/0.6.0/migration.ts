import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';
import { mediaItems } from '../../../src/db/vault/schema';
import { VaultAPI } from '../../../src/lib/VaultAPI';
import { MediaService } from '../../../src/services/MediaService';

/**
 * Migrates 0.5.0 vaults to 0.6.0
 * - Regenerates all .gif thumbnails
 */
export default async (vault: VaultAPI) => {
	// Regenerate all .gif thumbnails

	const images = await vault.getDb().query.mediaItems.findMany({
		where: eq(mediaItems.extension, 'png')
	});
	for (const potentialGif of images) {
		let filePath = path.join(
			vault.getConfig().path,
			'media',
			'images',
			`${potentialGif.fileName}.png`
		);
		const fileBuffer = await fs.readFile(filePath);
		// https://stackoverflow.com/questions/8473703/in-node-js-given-a-url-how-do-i-check-whether-its-a-jpg-png-gif
		if (fileBuffer.toString('hex', 0, 4) === '47494638') {
			await fs.unlink(filePath);

			filePath = filePath.replace('.png', '.gif');
			// Delete the old thumbnail
			await fs.unlink(
				path.join(
					vault.getConfig().path,
					'media',
					'images',
					'.thumb',
					`${potentialGif.fileName}.jpg`
				)
			);
			await fs.writeFile(filePath, fileBuffer.toString());

			await vault
				.getDb()
				.update(mediaItems)
				.set({ extension: 'gif' })
				.where(eq(mediaItems.id, potentialGif.id));

			potentialGif.extension = 'gif';
			const mediaService = vault.get(MediaService);
			mediaService.generateItemThumbnail('webp', filePath, potentialGif);
		}
	}
};
