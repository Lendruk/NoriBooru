import { inject, injectable } from 'inversify';
import { VaultDb } from '../../lib/VaultAPI';
import { VaultService } from '../../lib/VaultService';

type SDPrompt = {
	id: string;
	name: string | null;
	previewImage: string | null;
	positivePrompt: string;
	negativePrompt: string;
	sampler: string;
	steps: number;
	width: number;
	height: number;
	checkpoint: string;
	cfgScale: number;
	highRes: {
		upscaler: string | null;
		steps: number | null;
		denoisingStrength: number | null;
		upscaleBy: number | null;
	} | null;
};

@injectable()
export class PromptService extends VaultService {
	public constructor(@inject('db') protected readonly db: VaultDb) {
		super(db);
	}

	public async getPrompts(): Promise<SDPrompt[]> {
		const prompts = await this.db.query.sdPrompts.findMany();

		return prompts.map((prompt) => ({
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
		}));
	}
}
