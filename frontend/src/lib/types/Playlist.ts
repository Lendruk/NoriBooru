import type { MediaItem } from './MediaItem';
import type { SimplePlaylist } from './SimplePlaylist';

export type Playlist = SimplePlaylist & { items: MediaItem[] };
