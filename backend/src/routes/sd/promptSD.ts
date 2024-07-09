import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../hooks/checkVault';
import { mediaService } from '../../services/MediaService';
import { Request } from '../../types/Request';
import { SDPromptResponse } from '../../types/sd/SDPromptResponse';

type PromptResponse = {
	fileName: string;
	id: number;
	exif: string;
	isArchived: boolean;
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

	const requestBody = request.body;

	const result = await fetch(`http://localhost:${sdPort}/sdapi/v1/txt2img`, {
		method: 'POST',
		body: JSON.stringify(requestBody),
		headers: {
			'Content-Type': 'application/json'
		}
	});
	const body = (await result.json()) as SDPromptResponse;
	const items: PromptResponse[] = [];
	for (const image of body.images) {
		const { fileName, id, exif } = await mediaService.createImageFromBase64(image, vault);
		items.push({ fileName, id, exif, isArchived: false });
	}

	reply.send({ items });
};

export default {
	method: 'POST',
	url: '/sd/prompt',
	handler: promptSD,
	onRequest: checkVault
} as RouteOptions;
