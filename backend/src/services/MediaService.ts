import { randomUUID } from 'crypto';
import { VaultInstance } from '../db/VaultController';
import path from 'path';
import ExifReader from 'exifreader';
import sharp from 'sharp';
import { Exif } from '../types/Exif';
import { mediaItems } from '../db/vault/schema';
import * as fs from 'fs/promises';

class MediaService {  
	public async createImageFromBase64(base64EncodedImage: string, vault: VaultInstance): Promise<{ id: number, fileName: string }> {
		const { db } = vault;
		const id = randomUUID();
		const imageBuffer = Buffer.from(base64EncodedImage.replace(/^data:image\/\w+;base64,/, ''), 'base64');
		const imagePath = path.join(vault.path, 'media', 'images', `${id}.png`);
		await fs.writeFile(imagePath, imageBuffer);
		await sharp(imagePath).jpeg({ quality: 80 }).toFile(`${vault.path}/media/images/.thumb/${id}.jpg`);

		const fileSize = imageBuffer.byteLength;
		const exif = await ExifReader.load(imageBuffer) as Exif;
		const mediaItem = await db.insert(mediaItems).values({ 
			fileName: id, 
			extension: 'png',
			type: 'image', 
			fileSize, 
			createdAt: Date.now(), 
			exif: JSON.stringify(exif) 
		}).returning();

		return { id: mediaItem[0].id, fileName: mediaItem[0].fileName };
	}
}

export const mediaService = new MediaService();