import { createHash, randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import ExifReader from 'exifreader';
import Ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import {
	lorasToMediaItems,
	MediaItem,
	MediaItemMetadataSchema,
	mediaItems,
	mediaItemsMetadata,
	tagsToMediaItems
} from '../db/vault/schema';
import { VaultBase } from '../lib/VaultBase';
import { VaultInstance } from '../lib/VaultInstance';
import { ParsedExif } from '../types/Exif';
import { generateRandomColor } from '../utils/generateRandomColor';
import TagService from './TagService';

class MediaService {
	private getTypeFromExtension(fileExtension: string): 'image' | 'video' {
		if (['jpg', 'webp', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
			return 'image';
		}

		if (['mp4', 'webm'].includes(fileExtension)) {
			return 'video';
		}

		throw new Error('Invalid file extension');
	}

	private getFinalExtension(fileExtension: string): string {
		if (['jpg', 'webp', 'jpeg', 'png'].includes(fileExtension)) {
			return 'png';
		}
		return fileExtension;
	}

	public async getItemMetadata(vault: VaultInstance, id: number): Promise<MediaItemMetadataSchema> {
		const { db } = vault;
		const metadata = await db.query.mediaItemsMetadata.findFirst({
			where: eq(mediaItemsMetadata.mediaItem, id)
		});

		if (!metadata) {
			throw new Error('Metadata not found');
		}
		return metadata;
	}

	public async createMediaItemFromFile(
		vault: VaultInstance,
		fileExtension: string,
		originalFileName: string | undefined,
		preCalculatedId: string | undefined = undefined,
		sdCheckPointId: string | null = null,
		loras: string[] = []
	): Promise<MediaItem> {
		const { db } = vault;
		const fileType = this.getTypeFromExtension(fileExtension);
		const id = preCalculatedId ?? randomUUID();
		const finalPath = path.join(
			vault.path,
			'media',
			fileType === 'image' ? 'images' : 'videos',
			`${id}.${fileExtension}`
		);
		const [stats, buffer] = await Promise.all([fs.stat(finalPath), fs.readFile(finalPath)]);
		const hash = createHash('sha256');
		hash.update(buffer);
		const hexHash = hash.digest('hex').toString();
		// Exif
		const exif = fileType === 'image' ? ((await ExifReader.load(buffer)) as ParsedExif) : null;
		const [newMediaItem] = await db
			.insert(mediaItems)
			.values({
				fileName: id,
				extension: fileType === 'image' ? fileExtension : finalPath.split('.').pop()!,
				type: fileType,
				createdAt: Date.now(),
				hash: hexHash,
				sdCheckpoint: sdCheckPointId,
				originalFileName,
				fileSize: stats.size / (1024 * 1024)
			})
			.returning();

		if (exif) {
			await this.processMediaItemExif(vault, newMediaItem.id, exif);
		}

		await this.generateItemThumbnail(vault, fileExtension, finalPath, newMediaItem);

		for (const lora of loras) {
			await this.addLoraToMediaItem(vault, newMediaItem.id, lora);
		}

		return newMediaItem;
	}

	public async generateItemThumbnail(
		vault: VaultBase,
		fileExtension: string,
		filePath: string,
		mediaItem: MediaItem
	): Promise<void> {
		if (mediaItem.type === 'image') {
			if (fileExtension === 'gif') {
				await sharp(filePath, { animated: true })
					.webp({ quality: 70, lossless: false })
					.toFile(`${vault.path}/media/images/.thumb/${mediaItem.fileName}.webp`);
			} else {
				await sharp(filePath)
					.jpeg({ quality: 80 })
					.toFile(`${vault.path}/media/images/.thumb/${mediaItem.fileName}.jpg`);
			}
		} else if (mediaItem.type === 'video') {
			const thumbnailPath = path.join(
				vault.path,
				'media',
				'videos',
				'.thumb',
				`${mediaItem.fileName}.mp4`
			);
			const conversionPromise = new Promise((resolve, reject) => {
				Ffmpeg(filePath)
					.noAudio()
					.addOutputOption('-movflags', 'frag_keyframe+empty_moov')
					.addOutputOption('-pix_fmt', 'yuv420p')
					.size('640x480')
					.autoPad()
					.withFps(24)
					.withDuration(5)
					.saveToFile(thumbnailPath)
					.on('end', () => resolve(undefined))
					.on('error', (err) => reject(err));
			});
			await conversionPromise;
		}
	}

	public async createItemFromBase64(
		base64EncodedImage: string,
		fileExtension: string,
		vault: VaultInstance,
		originalFileName?: string,
		sdCheckPointId: string | null = null,
		loras: string[] = []
	): Promise<{ id: number; fileName: string }> {
		const id = randomUUID();
		const imageBuffer = Buffer.from(
			base64EncodedImage.replace(/^data:image\/\w+;base64,/, ''),
			'base64'
		);
		const fileType = this.getTypeFromExtension(fileExtension);
		const finalExtension = this.getFinalExtension(fileExtension);
		const itemPath = path.join(
			vault.path,
			'media',
			fileType === 'image' ? 'images' : 'videos',
			`${id}.${finalExtension}`
		);
		const hash = createHash('sha256').update(imageBuffer).digest('hex').toString();
		console.log(hash);
		await fs.writeFile(itemPath, imageBuffer);

		const newMediaItem = await this.createMediaItemFromFile(
			vault,
			finalExtension,
			originalFileName,
			id,
			sdCheckPointId,
			loras
		);

		for (const lora of loras) {
			await this.addLoraToMediaItem(vault, newMediaItem.id, lora);
		}
		return {
			id: newMediaItem.id,
			fileName: newMediaItem.fileName
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
		await db
			.update(mediaItems)
			.set({ sdCheckpoint: sdCheckpointId })
			.where(eq(mediaItems.id, mediaItemId));
	}

	private async processMediaItemExif(
		vault: VaultInstance,
		mediaItemId: number,
		exif: ParsedExif
	): Promise<MediaItemMetadataSchema> {
		let parsedPrompt: string = '';
		if (exif.UserComment) {
			parsedPrompt = String.fromCharCode(...exif.UserComment.value.filter((v) => v)).replace(
				'UNICODE',
				''
			);
		} else if (exif.parameters) {
			parsedPrompt = exif.parameters.value;
		}
		const metadataPayload: MediaItemMetadataSchema = {
			id: randomUUID(),
			mediaItem: mediaItemId,
			width: exif['Image Width']?.value ?? 0,
			height: exif['Image Height']?.value ?? 0,
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
						metadataPayload.denoisingStrength = Number.parseFloat(
							settingsObject['Denoising strength']
						);
						metadataPayload.upscaleBy = Number.parseFloat(settingsObject['Hires upscale']);
					} else if (settingsObject['Tiled Diffusion upscaler']) {
						metadataPayload.upscaler = settingsObject['Tiled Diffusion upscaler'];
						metadataPayload.upscaleBy = Number.parseFloat(
							settingsObject['Tiled Diffusion scale factor']
						);
						metadataPayload.denoisingStrength = Number.parseFloat(
							settingsObject['Denoising strength']
						);
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

	public async tagMediaItemFromPrompt(
		vault: VaultInstance,
		mediaItemIds: number[],
		prompt: string
	): Promise<void> {
		const aiTag = await TagService.getTagByName(vault, 'ai');
		const tags: number[] = [];
		for (const token of prompt.split(',')) {
			let formattedToken = token.trim().replaceAll('(', '').replaceAll(')', '');

			if (formattedToken.length === 0) continue;
			if (formattedToken.startsWith('<lora:')) continue;
			if (formattedToken === 'BREAK') continue;
			// Only allow creating tags with one space between words
			if (formattedToken.split(' ').length > 2) continue;

			// If this happens a comma was probably forgotten between tokens
			if (formattedToken.includes('<lora:')) {
				for (const partialToken of formattedToken.split('<')) {
					if (!partialToken.includes('lora:')) {
						formattedToken = partialToken;
						break;
					}
				}
			}

			formattedToken = formattedToken.split(':')[0];
			let tag = await TagService.getTagByName(vault, formattedToken);
			if (!tag) {
				tag = await TagService.createTag(vault, formattedToken, generateRandomColor());
			}
			tags.push(tag.id);
		}

		for (const id of mediaItemIds) {
			for (const tag of tags) {
				await mediaService.addTagToMediaItem(vault, id, tag);
			}

			if (aiTag) {
				await mediaService.addTagToMediaItem(vault, id, aiTag.id);
			}
		}
	}
}

export const mediaService = new MediaService();
