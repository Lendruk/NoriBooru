import type { MediaItem } from '../MediaItem';
import type { PopulatedTag } from '../PopulatedTag';

export type RawSDLora = {
	name: string;
	id: string;
	path: string;
	description: string;
	sdVersion: string;
	origin: string;
	tags: PopulatedTag[];
	activationWords: string[];
	metadata: {
		ss_sd_model_name: string;
		ss_resolution: string;
		ss_clip_skip: string;
		ss_num_train_images: string;
		ss_tag_frequency: Record<string, Record<string, number>>;
	};
};

export type SDLora = RawSDLora & {
	previewMediaItem?: Partial<MediaItem>;
	type: 'SLIDER' | 'MODIFIER' | 'NORMAL';
};
