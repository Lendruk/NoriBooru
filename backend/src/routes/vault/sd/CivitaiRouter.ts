import { randomUUID } from 'crypto';
import { FastifyReply, FastifyRequest } from 'fastify';
import fs, { createWriteStream } from 'fs';
import { inject, injectable } from 'inversify';
import path from 'path';
import { Readable } from 'stream';
import { finished, pipeline } from 'stream/promises';
import { sdCheckpoints, sdLoras } from '../../../db/vault/schema';
import { Job } from '../../../lib/Job';
import { Route, Router } from '../../../lib/Router';
import { VaultDb } from '../../../lib/VaultAPI';
import { JobService } from '../../../services/JobService';
import { MediaService } from '../../../services/MediaService';
import { SDService } from '../../../services/SDService';
import { VaultConfigService } from '../../../services/VaultConfigService';
import { CivitaiResource } from '../../../types/sd/CivtaiResource';
import { VaultConfig } from '../../../types/VaultConfig';

@injectable()
export class CivitaiRouter extends Router {
	public constructor(
		@inject(VaultConfigService) private readonly configService: VaultConfigService,
		@inject(JobService) private readonly jobService: JobService,
		@inject('config') private readonly config: VaultConfig,
		@inject('db') private readonly db: VaultDb,
		@inject(MediaService) private readonly mediaService: MediaService,
		@inject(SDService) private readonly sdService: SDService
	) {
		super();
	}

	@Route.POST('/sd/civitai/register')
	public async registerCivitaiApiKey(request: FastifyRequest, reply: FastifyReply) {
		const { key } = request.body as { key: string };

		if (key) {
			await this.configService.setCivitaiApiKey(key);
		}

		return reply.send({ message: 'API key registered successfully' });
	}

	@Route.POST('/sd/civitai/download-resource')
	public async downloadCivitaiResource(request: FastifyRequest, reply: FastifyReply) {
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
				headers: { Authorization: `Bearer ${this.config.civitaiApiKey}` }
			});
			const modelInfo = (await modelRequest.json()) as CivitaiResource;
			const modelVersion = modelInfo.modelVersions.find(
				(version) => version.id === Number.parseInt(modelVersionId)
			);

			console.log(JSON.stringify(modelInfo));
			if (modelVersion) {
				const primaryFile = modelVersion.files.find((file) => file.primary);

				if (primaryFile) {
					const filePath = `${this.config.path}/stable-diffusion-webui/models/${this.getFolderForModel(modelInfo.type)}/${primaryFile.name}`;
					const stream = fs.createWriteStream(filePath);
					const { body } = await fetch(primaryFile.downloadUrl, {
						headers: {
							Authorization: `Bearer ${this.config.civitaiApiKey}`,
							'Content-Disposition': 'inline'
						}
					});
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					await finished(Readable.fromWeb(body! as any).pipe(stream));

					// Create a preview image
					const imageRequest = await fetch(modelVersion.images[0].url);
					const id = randomUUID();
					const finalPath = path.join(this.config.path, 'media', 'images', `${id}.png`);
					await pipeline(imageRequest.body!, createWriteStream(finalPath));
					const mediaItem = await this.mediaService.createMediaItemFromFile({
						fileExtension: 'png',
						sdCheckPointId: modelId,
						loras: [],
						preCalculatedId: id
					});

					if (modelInfo.type === 'LORA') {
						const newLora = await this.db
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
						await this.mediaService.addLoraToMediaItem(mediaItem.id, newLora[0].id);
					} else if (modelInfo.type === 'Checkpoint') {
						const newCheckpoint = await this.db
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
						await this.mediaService.setMediaItemSDCheckpoint(mediaItem.id, newCheckpoint[0].id);
					}

					if (this.sdService.isSDUiRunning()) {
						if (modelInfo.type === 'LORA') {
							await this.sdService.refreshLoras();
						} else if (modelInfo.type === 'Checkpoint') {
							await this.sdService.refreshCheckpoints();
						}
					}
				}
			} else {
				throw new Error('Model version not found');
			}
		});

		this.jobService.registerJob(civitaiImportJob);
		this.jobService.runJob(civitaiImportJob.id);

		reply.send({
			message: 'Job registered successfully!',
			id: civitaiImportJob.id,
			name: civitaiImportJob.name,
			tag: civitaiImportJob.tag
		});
	}

	private getFolderForModel = (modelType: string): string => {
		switch (modelType) {
			case 'LORA':
				return 'Lora';
			case 'Checkpoint':
				return 'Stable-diffusion';
		}
		throw new Error('Unsupported model type');
	};
}
