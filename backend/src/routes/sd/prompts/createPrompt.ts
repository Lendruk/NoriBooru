import { randomUUID } from 'crypto';
import { FastifyReply, RouteOptions } from 'fastify';
import { sdPrompts } from '../../../db/vault/schema';
import { checkVault } from '../../../hooks/checkVault';
import { VaultRequest } from '../../../types/Request';

type RequestOptions = {
	name: string;
	positivePrompt: string;
	negativePrompt: string;
	sampler: string;
	steps: number;
	width: number;
	height: number;
	checkpoint: string;
	cfgScale: number;
	isHighResEnabled: boolean;
	highRes: {
		upscaler: string;
		steps: number;
		denoisingStrength: number;
		upscaleBy: number;
	} | null;
};

const createPrompt = async (request: VaultRequest, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}
	const { db } = vault;
	const body = request.body as RequestOptions;

	const prompt = (
		await db
			.insert(sdPrompts)
			.values({
				name: body.name,
				cfgScale: body.cfgScale,
				checkpoint: body.checkpoint,
				createdAt: new Date().getTime(),
				height: body.height,
				width: body.width,
				id: randomUUID(),
				negativePrompt: body.negativePrompt,
				positivePrompt: body.positivePrompt,
				isHighResEnabled: body.highRes ? 1 : 0,
				sampler: body.sampler,
				steps: body.steps,
				highResDenoisingStrength: body.highRes?.denoisingStrength,
				highResSteps: body.highRes?.steps,
				highResUpscaleBy: body.highRes?.upscaleBy,
				highResUpscaler: body.highRes?.upscaler
			})
			.returning()
	)[0];

	reply.send(prompt);
};

export default {
	method: 'POST',
	url: '/sd/prompts',
	handler: createPrompt,
	onRequest: checkVault
} as RouteOptions;
