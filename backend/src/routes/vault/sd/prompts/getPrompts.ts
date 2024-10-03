import { FastifyReply, RouteOptions } from 'fastify';
import { checkVault } from '../../../../hooks/checkVault';
import { VaultRequest } from '../../../../types/Request';

const getPrompts = async (request: VaultRequest, reply: FastifyReply) => {
	const vaultInstance = request.vault;

	if (!vaultInstance) {
		return reply.status(400).send('No vault provided');
	}

	const { db } = vaultInstance;
	const prompts = await db.query.sdPrompts.findMany();

	return reply.send(
		prompts.map((prompt) => ({
			id: prompt.id,
			name: prompt.name,
			previewImage: prompt.previewImage,
			positivePrompt: prompt.positivePrompt,
			negativePrompt: prompt.negativePrompt,
			sampler: prompt.sampler,
			steps: prompt.steps,
			width: prompt.width,
			height: prompt.height,
			checkpoint: prompt.checkpoint,
			cfgScale: prompt.cfgScale,
			highRes: prompt.isHighResEnabled
				? {
						upscaler: prompt.highResUpscaler,
						steps: prompt.highResSteps,
						denoisingStrength: prompt.highResDenoisingStrength,
						upscaleBy: prompt.highResUpscaleBy
					}
				: null
		}))
	);
};

export default {
	method: 'GET',
	url: '/sd/prompts',
	handler: getPrompts,
	onRequest: checkVault
} as RouteOptions;
