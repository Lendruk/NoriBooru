import type { MediaItem } from '../MediaItem';

export type SDCheckpoint = {
	id: string;
	name: string;
	previewMediaItem?: Partial<MediaItem>;
	description: string;
	path: string;
	origin: string;
	sdVersion: string;
	sha256: string;
};
