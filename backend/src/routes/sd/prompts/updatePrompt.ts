import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../../types/Request';
import { checkVault } from '../../../hooks/checkVault';
import { sdPrompts } from '../../../db/vault/schema';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

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

const updatePrompt = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}
	const { db } = vault;
	const params = request.params as { id: string };
	const body = request.body as RequestOptions;

	const prompt = (
		await db
			.update(sdPrompts)
			.set({
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
			.where(eq(sdPrompts.id, params.id))
			.returning()
	)[0];

	reply.send(prompt);
};

export default {
	method: 'PUT',
	url: '/sd/prompts/:id',
	handler: updatePrompt,
	onRequest: checkVault
} as RouteOptions;
