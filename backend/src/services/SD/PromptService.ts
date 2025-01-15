import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { inject, injectable } from 'inversify';
import { sdPrompts, SDPromptSchema } from '../../db/vault/schema';
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

export type CreatePromptOptions = {
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

@injectable()
export class PromptService extends VaultService {
	public constructor(@inject('db') protected readonly db: VaultDb) {
		super(db);
	}

	public async createPrompt(options: CreatePromptOptions): Promise<SDPromptSchema> {
		const prompt = (
			await this.db
				.insert(sdPrompts)
				.values({
					name: options.name,
					cfgScale: options.cfgScale,
					checkpoint: options.checkpoint,
					createdAt: new Date().getTime(),
					height: options.height,
					width: options.width,
					id: randomUUID(),
					negativePrompt: options.negativePrompt,
					positivePrompt: options.positivePrompt,
					isHighResEnabled: options.highRes ? 1 : 0,
					sampler: options.sampler,
					steps: options.steps,
					highResDenoisingStrength: options.highRes?.denoisingStrength,
					highResSteps: options.highRes?.steps,
					highResUpscaleBy: options.highRes?.upscaleBy,
					highResUpscaler: options.highRes?.upscaler
				})
				.returning()
		)[0];

		return prompt;
	}

	public async updatePrompt(id: string, options: CreatePromptOptions): Promise<SDPromptSchema> {
		const prompt = (
			await this.db
				.update(sdPrompts)
				.set({
					name: options.name,
					cfgScale: options.cfgScale,
					checkpoint: options.checkpoint,
					createdAt: new Date().getTime(),
					height: options.height,
					width: options.width,
					id: randomUUID(),
					negativePrompt: options.negativePrompt,
					positivePrompt: options.positivePrompt,
					isHighResEnabled: options.highRes ? 1 : 0,
					sampler: options.sampler,
					steps: options.steps,
					highResDenoisingStrength: options.highRes?.denoisingStrength,
					highResSteps: options.highRes?.steps,
					highResUpscaleBy: options.highRes?.upscaleBy,
					highResUpscaler: options.highRes?.upscaler
				})
				.where(eq(sdPrompts.id, id))
				.returning()
		)[0];
		return prompt;
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

	public async deletePrompt(promptId: string): Promise<void> {
		await this.db.delete(sdPrompts).where(eq(sdPrompts.id, promptId));
	}
}
