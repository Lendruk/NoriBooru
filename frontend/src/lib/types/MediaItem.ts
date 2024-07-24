import type { PopulatedTag } from './PopulatedTag';

export type MediaItemMetadata = {
	id: string;
	width: number;
	height: number;
	positivePrompt: string;
	negativePrompt: string;
	steps: number;
	seed: number;
	sampler: string;
	model: string;
	upscaler: string;
	upscaleBy: number;
	cfgScale: number;
	vae: string;
	loras: string;
	denoisingStrength: number;
}

type BaseMediaItem = {
	id: number;
	fileName: string;
	type: string;
	extension: string;
	fileSize: number;
	createdAt: number;
	updatedAt: number | null;
	isArchived: boolean;
	metadata?: MediaItemMetadata
};

export type MediaItem = BaseMediaItem & {
	tags: number[];
};

export type MediaItemWithTags = BaseMediaItem & { tags: PopulatedTag[] };
