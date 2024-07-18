import { randomInt } from 'crypto';
import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../hooks/checkVault';
import { mediaService } from '../../services/MediaService';
import TagService from '../../services/TagService';
import { Request } from '../../types/Request';
import { SDPromptRequest } from '../../types/sd/SDPromptRequest';
import { SDPromptResponse } from '../../types/sd/SDPromptResponse';

type PromptResponse = {
	fileName: string;
	id: number;
	exif: string;
	isArchived: boolean;
};

type RequestBody = {
	autoTag: boolean;
	checkpointId: string;
	loras: string[];
	prompt: SDPromptRequest;
}

const generateRandomColor = (): string => {
	const numbers: number[] = [];

	for (let i = 0; i < 6; i++) {
		numbers.push(randomInt(10));
	}
	return `#${numbers.join('')}`;
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

	const { autoTag, checkpointId, loras, prompt} = request.body as RequestBody;

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
		const { fileName, id, exif } = await mediaService.createImageFromBase64(image, vault, checkpointId, loras);
		items.push({ fileName, id, exif, isArchived: false });
	}

	// Prompt tags
	// Can be optimized
	if (autoTag) {
		const tags: number[] = [];
		for (const token of prompt.prompt.split(',')) {
			const formattedToken = token.trim();

			if (formattedToken.length === 0) continue;
			if (formattedToken.startsWith('<lora:')) continue;
			// Only allow creating tags with one space between words
			if (formattedToken.split(' ').length > 2) continue;

			let tag = await TagService.getTagByName(vault, token);
			if (!tag) {
				tag = await TagService.createTag(vault, token, generateRandomColor());
			}
			tags.push(tag.id);
		}

		for (const item of items) {
			for(const tag of tags)  {
				await mediaService.addTagToMediaItem(vault, item.id, tag);
			}
		}
	}

	reply.send({ items });
};

export default {
	method: 'POST',
	url: '/sd/prompt',
	handler: promptSD,
	onRequest: checkVault
} as RouteOptions;
