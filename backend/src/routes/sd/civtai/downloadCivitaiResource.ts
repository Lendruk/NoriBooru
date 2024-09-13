import { randomUUID } from 'crypto';
import { FastifyReply, RouteOptions } from 'fastify';
import fs, { createWriteStream } from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { finished, pipeline } from 'stream/promises';
import { sdCheckpoints, sdLoras } from '../../../db/vault/schema';
import { checkVault } from '../../../hooks/checkVault';
import { Job } from '../../../lib/Job';
import { Request } from '../../../types/Request';
import { CivitaiResource } from '../../../types/sd/CivtaiResource';

const downloadCivitaiResource = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const civitaiImportJob = new Job('civitai-import', 'Civitai import', async () => {
		const { url } = request.body as { url: string };
		const splitUrl = url.split('/');
		console.log(splitUrl);
		if (splitUrl[2] !== 'civitai.com') {
			return reply.status(400).send({ message: 'Invalid url' });
		}

		// TODO: This whole implementation is very brittle, improve in the future
		const index = splitUrl.findIndex((value) => value === 'models');

		const modelId = splitUrl[index + 1];
		const modelVersionId = splitUrl[splitUrl.length - 1].split('=')[1];
		console.log(modelId);
		console.log(modelVersionId);

		const modelRequest = await fetch(`https://civitai.com/api/v1/models/${modelId}`, {
			headers: { Authorization: `Bearer ${vault.civitaiApiKey}` }
		});
		const modelInfo = (await modelRequest.json()) as CivitaiResource;
		const modelVersion = modelInfo.modelVersions.find(
			(version) => version.id === Number.parseInt(modelVersionId)
		);

		console.log(JSON.stringify(modelInfo));
		if (modelVersion) {
			const primaryFile = modelVersion.files.find((file) => file.primary);

			if (primaryFile) {
				const filePath = `${vault.path}/stable-diffusion-webui/models/${getFolderForModel(modelInfo.type)}/${primaryFile.name}`;
				const stream = fs.createWriteStream(filePath);
				const { body } = await fetch(primaryFile.downloadUrl, {
					headers: {
						Authorization: `Bearer ${vault.civitaiApiKey}`,
						'Content-Disposition': 'inline'
					}
				});
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				await finished(Readable.fromWeb(body! as any).pipe(stream));

				const { db } = vault;

				// Create a preview image
				const imageRequest = await fetch(modelVersion.images[0].url);
				const id = randomUUID();
				const finalPath = path.join(vault.path, 'media', 'images', `${id}.png`);
				await pipeline(imageRequest.body!, createWriteStream(finalPath));
				const mediaItem = await vault.media.createMediaItemFromFile({
					fileExtension: 'png',
					sdCheckPointId: modelId,
					loras: [],
					preCalculatedId: id
				});

				if (modelInfo.type === 'LORA') {
					const newLora = await db
						.insert(sdLoras)
						.values({
							id: randomUUID(),
							name: modelInfo.name,
							path: filePath,
							origin: url,
							sdVersion: modelVersion.baseModel,
							description: modelInfo.description,
							previewImage: mediaItem.fileName,
							activationWords: JSON.stringify(modelVersion.trainedWords),
							metadata: ''
						})
						.returning();
					await vault.media.addLoraToMediaItem(mediaItem.id, newLora[0].id);
				} else if (modelInfo.type === 'Checkpoint') {
					const newCheckpoint = await db
						.insert(sdCheckpoints)
						.values({
							id: randomUUID(),
							name: modelInfo.name,
							description: modelInfo.description,
							path: filePath,
							origin: url,
							sdVersion: modelVersion.baseModel,
							previewImage: mediaItem.fileName,
							sha256: ''
						})
						.returning();
					await vault.media.setMediaItemSDCheckpoint(mediaItem.id, newCheckpoint[0].id);
				}

				if (vault.isSDUiRunning()) {
					if (modelInfo.type === 'LORA') {
						await vault.refreshLoras();
					} else if (modelInfo.type === 'Checkpoint') {
						await vault.refreshCheckpoints();
					}
				}
			}
		} else {
			throw new Error('Model version not found');
		}
	});

	vault.registerJob(civitaiImportJob);
	vault.runJob(civitaiImportJob.id);

	reply.send({
		message: 'Job registered successfully!',
		id: civitaiImportJob.id,
		name: civitaiImportJob.name,
		tag: civitaiImportJob.tag
	});
};

const getFolderForModel = (modelType: string): string => {
	switch (modelType) {
		case 'LORA':
			return 'Lora';
		case 'Checkpoint':
			return 'Stable-diffusion';
	}
	throw new Error('Unsupported model type');
};

export default {
	method: 'POST',
	url: '/sd/civitai/download-resource',
	handler: downloadCivitaiResource,
	onRequest: checkVault
} as RouteOptions;
