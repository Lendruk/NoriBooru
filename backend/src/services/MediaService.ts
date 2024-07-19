import { createHash, randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import ExifReader from 'exifreader';
import * as fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { lorasToMediaItems, MediaItem, mediaItems, tagsToMediaItems } from '../db/vault/schema';
import { VaultBase } from '../lib/VaultBase';
import { VaultInstance } from '../lib/VaultInstance';
import { Exif } from '../types/Exif';

class MediaService {
	public async createMediaItemFromFile(
		vault: VaultInstance,
		filePath: string,
		fileType: 'image' | 'video',
		preCalculatedId: string | undefined = undefined,
		sdCheckPointId: string | null = null,
		loras: string[] = [],
	): Promise<MediaItem> {
		const { db } = vault;
		const [stats, buffer] = await Promise.all([fs.stat(filePath), fs.readFile(filePath)]);
		const hash = createHash('sha256');
		hash.update(buffer);
		const hexHash = hash.digest('hex').toString();
		const id = preCalculatedId ?? randomUUID();
		// Exif
		const exif = fileType === 'image' ? (await ExifReader.load(buffer)) as Exif : '';
		const newMediaItem = await db
			.insert(mediaItems)
			.values({
				fileName: id,
				extension: fileType === 'image' ? 'png' : 'mp4',
				exif: JSON.stringify(exif),
				type: fileType,
				createdAt: Date.now(),
				hash: hexHash,
				sdCheckpoint: sdCheckPointId,
				fileSize: stats.size / (1024 * 1024)
			})
			.returning();

		// Create thumbnail in case of images
		if (fileType === 'image') {
			await sharp(filePath)
				.jpeg({ quality: 80 })
				.toFile(`${vault.path}/media/images/.thumb/${id}.jpg`);
		}

		for (const lora of loras) {
			await this.addLoraToMediaItem(vault, newMediaItem[0].id, lora);
		}

		return newMediaItem[0];
	}

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

	public async setMediaItemSDCheckpoint(
		vault: VaultInstance,
		mediaItemId: number,
		sdCheckpointId: string
	): Promise<void> {
		const { db } = vault;
		await db.update(mediaItems).set({ sdCheckpoint: sdCheckpointId }).where(eq(mediaItems.id, mediaItemId));
	}
}

export const mediaService = new MediaService();
