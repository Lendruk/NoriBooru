import type { PopulatedTag } from '../PopulatedTag';

export type SDLora = {
	name: string;
	previewImage?: string;
	id: string;
	path: string;
	description: string;
	sdVersion: string;
	tags: PopulatedTag[];
	metadata: {
		ss_sd_model_name: string;
		ss_resolution: string;
		ss_clip_skip: string;
		ss_num_train_images: string;
		ss_tag_frequency: Record<string, Record<string, number>>;
	};
};
