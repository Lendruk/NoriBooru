export type SavedPrompt = {
	id?: string;
	name: string;
	previewMediaItem: number;
	positivePrompt: string;
	negativePrompt: string;
	sampler: string;
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
