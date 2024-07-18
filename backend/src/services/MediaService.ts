import { createHash, randomUUID } from 'crypto';
import ExifReader from 'exifreader';
import * as fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { lorasToMediaItems, mediaItems, tagsToMediaItems } from '../db/vault/schema';
import { VaultBase } from '../lib/VaultBase';
import { VaultInstance } from '../lib/VaultInstance';
import { Exif } from '../types/Exif';

class MediaService {
	public async createImageFromBase64(
		base64EncodedImage: string,
		vault: VaultInstance,
		sdCheckPointId: string | null = null,
		loras: string[] = [],
	): Promise<{ id: number; fileName: string; exif: string }> {
		const { db } = vault;
		const id = randomUUID();
		const imageBuffer = Buffer.from(
			base64EncodedImage.replace(/^data:image\/\w+;base64,/, ''),
			'base64'
		);
		const imagePath = path.join(vault.path, 'media', 'images', `${id}.png`);

		const hash = createHash('sha256').update(imageBuffer).digest('hex').toString();
		console.log(hash);
		await fs.writeFile(imagePath, imageBuffer);
		await sharp(imagePath)
			.jpeg({ quality: 80 })
			.toFile(`${vault.path}/media/images/.thumb/${id}.jpg`);

		const fileSize = imageBuffer.byteLength;
		const exif = (await ExifReader.load(imageBuffer)) as Exif;
		const mediaItem = await db
			.insert(mediaItems)
			.values({
				fileName: id,
				extension: 'png',
				type: 'image',
				fileSize,
				createdAt: Date.now(),
				sdCheckpoint: sdCheckPointId,
				hash,
				exif: JSON.stringify(exif)
			})
			.returning();

		for (const lora of loras) {
			await this.addLoraToMediaItem(vault, mediaItem[0].id, lora);
		}
		return {
			id: mediaItem[0].id,
			fileName: mediaItem[0].fileName,
			exif: mediaItem[0].exif!
		};
	}

	public async addLoraToMediaItem(
		vault: VaultInstance,
		mediaItemId: number,
		loraId: string
	): Promise<void> {
		const { db } = vault;
		await db.insert(lorasToMediaItems).values({ loraId, mediaItemId });
	}

	public async addTagToMediaItem(
		vault: VaultBase, 
		mediaItemId: number,
		tagId: number 
	): Promise<void> {
		const { db } = vault;
		await db.insert(tagsToMediaItems).values({ tagId: tagId, mediaItemId: mediaItemId });
	}
}

export const mediaService = new MediaService();
