import { FastifyReply, RouteOptions } from 'fastify';
import { MediaItemMetadataSchema } from '../../db/vault/schema';
import { checkVault } from '../../hooks/checkVault';
import { Request } from '../../types/Request';
import { SDPromptRequest } from '../../types/sd/SDPromptRequest';
import { SDPromptResponse } from '../../types/sd/SDPromptResponse';

type PromptResponse = {
	fileName: string;
	id: number;
	metadata: MediaItemMetadataSchema;
	isArchived: boolean;
};

type RequestBody = {
	autoTag: boolean;
	checkpointId: string;
	loras: string[];
	prompt: SDPromptRequest;
};

const promptSD = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}
	const sdPort = vault.getSdPort();
	if (!sdPort) {
		return reply.status(400).send('SD Ui is not running for the given vault');
	}

	const { autoTag, checkpointId, loras, prompt } = request.body as RequestBody;

	const result = await fetch(`http://localhost:${sdPort}/sdapi/v1/txt2img`, {
		method: 'POST',
		body: JSON.stringify(prompt),
		headers: {
			'Content-Type': 'application/json'
		}
	});
	const body = (await result.json()) as SDPromptResponse;
	const items: PromptResponse[] = [];

	for (const image of body.images) {
		const { fileName, id } = await vault.media.createItemFromBase64({
			base64EncodedImage: image,
			fileExtension: 'png',
			sdCheckPointId: checkpointId,
			loras
		});
		const metadata = await vault.media.getItemMetadata(id);
		items.push({ fileName, id, metadata, isArchived: false });
	}

	// Prompt tags
	// Can be optimized
	if (autoTag) {
		await vault.media.tagMediaItemFromPrompt(
			items.map((item) => item.id),
			prompt.prompt
		);
	}

	reply.send({ items });
};

export default {
	method: 'POST',
	url: '/sd/prompt',
	handler: promptSD,
	onRequest: checkVault
} as RouteOptions;
