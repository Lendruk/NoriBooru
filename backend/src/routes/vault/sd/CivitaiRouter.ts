import { randomUUID } from 'crypto';
import { FastifyReply, FastifyRequest } from 'fastify';
import fs, { createWriteStream } from 'fs';
import { inject, injectable } from 'inversify';
import path from 'path';
import { Readable } from 'stream';
import { finished, pipeline } from 'stream/promises';
import { SDCheckpointSchema, SDLoraSchema } from '../../../db/vault/schema';
import { Job } from '../../../lib/Job';
import { Route, Router } from '../../../lib/Router';
import { VaultDb } from '../../../lib/VaultAPI';
import { JobService } from '../../../services/JobService';
import { MediaService } from '../../../services/MediaService';
import { SDCheckpointService } from '../../../services/SD/SDCheckpointService';
import { SDLoraService } from '../../../services/SD/SDLoraService';
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
		@inject(SDLoraService) private readonly loraService: SDLoraService,
		@inject(SDCheckpointService) private readonly sdCheckpointService: SDCheckpointService
	) {
		super();
	}

	@Route.POST('/sd/civitai/register')
	public async registerCivitaiApiKey(request: FastifyRequest, reply: FastifyReply) {
		const { key } = request.body as { key: string };

		if (key) {
			await this.configService.setConfigValue('civitaiApiKey', key, true);
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

				if (!['Checkpoint', 'LORA'].includes(modelInfo.type)) {
					throw new Error('Unsupported model type');
				}

				if (primaryFile) {
					const filePath = `${this.config.path}/sd/${this.getFolderForModel(modelInfo.type)}/${primaryFile.name}`;
					const stream = fs.createWriteStream(filePath);
					const { body } = await fetch(primaryFile.downloadUrl, {
						headers: {
							Authorization: `Bearer ${this.config.civitaiApiKey}`,
							'Content-Disposition': 'inline'
						}
					});

					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					await finished(Readable.fromWeb(body! as any).pipe(stream));

					console.log('File downloaded');
					// Create a preview image
					const imageRequest = await fetch(modelVersion.images[0].url);
					const id = randomUUID();
					const finalPath = path.join(this.config.path, 'media', 'images', `${id}.png`);
					let newCheckpoint: SDCheckpointSchema | undefined;
					let newLora: SDLoraSchema | undefined;
					try {
						if (modelInfo.type === 'LORA') {
							console.log('Lora');
							newLora = await this.loraService.createLora({
								name: modelInfo.name,
								description: modelInfo.description,
								sdVersion: modelVersion.baseModel,
								origin: url,
								activationWords: modelVersion.trainedWords,
								path: filePath
							});
						} else if (modelInfo.type === 'Checkpoint') {
							console.log('Checkpoint');

							newCheckpoint = await this.sdCheckpointService.createCheckpoint({
								name: modelInfo.name,
								description: modelInfo.description,
								sdVersion: modelVersion.baseModel,
								origin: url,
								path: filePath
							});
						}

						await pipeline(imageRequest.body!, createWriteStream(finalPath));
						const mediaItem = await this.mediaService.createMediaItemFromFile({
							fileExtension: 'png',
							sdCheckPointId: undefined,
							loras: [],
							preCalculatedId: id
						});

						if (newLora) {
							await this.mediaService.addLoraToMediaItem(mediaItem.id, newLora.id);
							await this.loraService.updateLora(newLora.id, {
								previewMediaItem: mediaItem.id
							});
						} else if (newCheckpoint) {
							await this.mediaService.setMediaItemSDCheckpoint(mediaItem.id, newCheckpoint.id);
						}
						console.log('Preview image created');
					} catch (error) {
						console.log(error);
						throw error;
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
				return 'loras';
			case 'Checkpoint':
				return 'checkpoints';
		}
		throw new Error('Unsupported model type');
	};
}
