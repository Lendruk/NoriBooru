import type { PromptBody } from './SD/SDPromptRequest';

export type SavedPrompt = {
	id?: string;
	name: string;
	previewMediaItem: number;
	positivePrompt: PromptBody;
	negativePrompt: PromptBody;
	scheduler: string;
	steps: number;
	width: number;
	height: number;
	checkpoint: string;
	cfgScale: number;
	highRes: {
		upscaler: string;
		steps: number;
		denoisingStrength: number;
		upscaleBy: number;
	} | null;
	createdAt: number;
};
