import { createHash, randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import ExifReader from 'exifreader';
import * as fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { lorasToMediaItems, MediaItem, MediaItemMetadataSchema, mediaItems, mediaItemsMetadata, tagsToMediaItems } from '../db/vault/schema';
import { VaultBase } from '../lib/VaultBase';
import { VaultInstance } from '../lib/VaultInstance';
import { ParsedExif } from '../types/Exif';

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
		const exif = fileType === 'image' ? (await ExifReader.load(buffer)) as ParsedExif : null;
		const [newMediaItem] = await db
			.insert(mediaItems)
			.values({
				fileName: id,
				extension: fileType === 'image' ? 'png' : 'mp4',
				// exif: JSON.stringify(exif),
				type: fileType,
				createdAt: Date.now(),
				hash: hexHash,
				sdCheckpoint: sdCheckPointId,
				fileSize: stats.size / (1024 * 1024)
			})
			.returning();
		
		if (exif) {
			await this.processMediaItemExif(vault, newMediaItem.id, exif);
		}

		// Create thumbnail in case of images
		if (fileType === 'image') {
			await sharp(filePath)
				.jpeg({ quality: 80 })
				.toFile(`${vault.path}/media/images/.thumb/${id}.jpg`);
		}

		for (const lora of loras) {
			await this.addLoraToMediaItem(vault, newMediaItem.id, lora);
		}

		return newMediaItem;
	}

	public async createImageFromBase64(
		base64EncodedImage: string,
		vault: VaultInstance,
		sdCheckPointId: string | null = null,
		loras: string[] = [],
	): Promise<{ id: number; fileName: string; metadata: MediaItemMetadataSchema }> {
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
		const exif = (await ExifReader.load(imageBuffer)) as ParsedExif;
		const [newMediaItem] = await db
			.insert(mediaItems)
			.values({
				fileName: id,
				extension: 'png',
				type: 'image',
				fileSize,
				createdAt: Date.now(),
				sdCheckpoint: sdCheckPointId,
				hash,
			})
			.returning();
		const metadata = await this.processMediaItemExif(vault, newMediaItem.id, exif);

		for (const lora of loras) {
			await this.addLoraToMediaItem(vault, newMediaItem.id, lora);
		}
		return {
			id: newMediaItem.id,
			fileName: newMediaItem.fileName,
			metadata,
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

	private async processMediaItemExif(vault: VaultInstance, mediaItemId: number, exif: ParsedExif): Promise<MediaItemMetadataSchema> {
		let parsedPrompt: string = '';
		if (exif.UserComment) {
			parsedPrompt = String.fromCharCode(...(exif.UserComment.value.filter(v => v))).replace('UNICODE', '');
		} else if (exif.parameters) {
			parsedPrompt = exif.parameters.value;
		}
		const metadataPayload: MediaItemMetadataSchema = {
			id: randomUUID(),
			mediaItem: mediaItemId,
			width: exif['Image Width'].value,
			height: exif['Image Height'].value,
			cfgScale: null,
			denoisingStrength: null,
			loras: null,
			model: null,
			negativePrompt: null,
			positivePrompt: null,
			sampler: null,
			seed: null,
			steps: null,
			upscaleBy: null,
			upscaler: null,
			vae: null
		};
		
		
		const splitPrompt = parsedPrompt.split('\n');
		if (splitPrompt.length > 0) {
			metadataPayload.positivePrompt = splitPrompt[0];
			for (let i = 1; i < splitPrompt.length; i++) {
				const value = splitPrompt[i];
				if (value.includes('Negative prompt:')) {
					metadataPayload.negativePrompt = value.split(': ')[1];
				} else {
					const settingsObject: Record<string, string> = {};
					for (const part of value.split(',')) {
						const splitPart = part.split(': ');
						settingsObject[splitPart[0].trim()] = splitPart[1];
					}
					metadataPayload.seed = Number.parseInt(settingsObject.Seed);
					metadataPayload.model = settingsObject.Model;
					metadataPayload.sampler = settingsObject.Sampler;
					metadataPayload.steps = Number.parseInt(settingsObject.Steps);
					metadataPayload.cfgScale = Number.parseInt(settingsObject['CFG scale']);
					metadataPayload.vae = settingsObject.VAE ? settingsObject.VAE.split('.')[0] : null;
	
					if (settingsObject['Hires upscaler']) {
						metadataPayload.upscaler = settingsObject['Hires upscaler'];
						// isHighResEnabled = true;
						metadataPayload.denoisingStrength = Number.parseFloat(settingsObject['Denoising strength']);
						metadataPayload.upscaleBy = Number.parseFloat(settingsObject['Hires upscale']);
					} else if (settingsObject['Tiled Diffusion upscaler']) {
						metadataPayload.upscaler = settingsObject['Tiled Diffusion upscaler'];
						metadataPayload.upscaleBy = Number.parseFloat(settingsObject['Tiled Diffusion scale factor']);
						metadataPayload.denoisingStrength = Number.parseFloat(settingsObject['Denoising strength']);
					}
	
					// if (settingsObject.Refiner) {
					// 	isRefinerEnabled = true;
					// 	refinerCheckpoint = settingsObject.Refiner.trim().split(' ')[0];
					// 	refinerSwitchAt = Number.parseFloat(settingsObject['Refiner switch at']);
					// }
				}
			}
		}

		const { db } = vault;
		const [newMetadata] = await db.insert(mediaItemsMetadata).values(metadataPayload).returning();
		return newMetadata;
	}
}

export const mediaService = new MediaService();
