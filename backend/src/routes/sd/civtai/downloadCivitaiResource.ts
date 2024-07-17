import { randomUUID } from 'crypto';
import { FastifyReply, RouteOptions } from 'fastify';
import fs from 'fs';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import { sdCheckpoints, sdLoras } from '../../../db/vault/schema';
import { checkVault } from '../../../hooks/checkVault';
import { Request } from '../../../types/Request';
import { CivitaiResource } from '../../../types/sd/CivtaiResource';


const downloadCivitaiResource = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { url } = request.body as { url: string };

	const splitUrl = url.split('/');
	console.log(splitUrl);

	if (splitUrl[2] !== 'civitai.com') {
		return reply.status(400).send({ message: 'Invalid url' });
	}

	// TODO: This whole implementation is very brittle, improve in the future
	const index = splitUrl.findIndex(value => value === 'models');

	const modelId = splitUrl[index + 1];
	const modelVersionId = splitUrl[splitUrl.length - 1].split('=')[1];
	console.log(modelId);
	console.log(modelVersionId);
	

	const modelRequest = await fetch(`https://civitai.com/api/v1/models/${modelId}`, { headers: { 'Authorization': `Bearer ${vault.civitaiApiKey}`}});
	const modelInfo = (await modelRequest.json()) as CivitaiResource;
	const modelVersion = modelInfo.modelVersions.find(version => version.id === Number.parseInt(modelVersionId));

	console.log(JSON.stringify(modelInfo));
	if (modelVersion) {
		const primaryFile = modelVersion.files.find(file => file.primary);

		if (primaryFile) {
			const filePath = `${vault.path}/stable-diffusion-webui/models/${getFolderForModel(modelInfo.type)}/${primaryFile.name}`;
			const stream = fs.createWriteStream(filePath);
			const { body } = await fetch(primaryFile.downloadUrl, { headers: { 'Authorization': `Bearer ${vault.civitaiApiKey}`, 'Content-Disposition': 'inline' }});
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			await finished(Readable.fromWeb(body! as any).pipe(stream));

			const { db } = vault;
			if (modelInfo.type === 'LORA') {
				await db.insert(sdLoras).values({
					id: randomUUID(),
					name: modelInfo.name,
					path: filePath,
					origin: url,
					sdVersion: modelVersion.baseModel,
					description: modelInfo.description,
					activationWords: '',
					metadata: ''
				});
			} else if (modelInfo.type === 'Checkpoint') {
				await db.insert(sdCheckpoints).values({
					id: randomUUID(),
					name: modelInfo.name,
					description: modelInfo.description,
					path: filePath,
					origin: url,
					sdVersion: modelVersion.baseModel,
					sha256: '',
				});
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
		return reply.status(400).send({ message: 'Model version not found'});
	}

	reply.send({ message: 'ok'});
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