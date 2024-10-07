import type { ApiEndpoint } from './services/HttpService';

type EndpointNames =
	| 'getVaults'
	| 'getWatchers'
	| 'getWatcher'
	| 'getTags'
	| 'getMediaItemTags'
	| 'getTag'
	| 'getPlaylist'
	| 'getPlaylists'
	| 'getApiKeys'
	| 'getMediaItem'
	| 'getSDLoras'
	| 'getSDPrompts'
	| 'getVaultPort'
	| 'getSDCheckpoints'
	| 'getMediaItemsForReview'
	| 'getMediaItems';

type Endpoints = {
	[key in EndpointNames]: (options?: {
		id?: string | number;
		params?: string | URLSearchParams;
	}) => ApiEndpoint;
};

export const endpoints: Endpoints = {
	getVaults: () => ({
		url: '/vaults',
		isGlobal: true
	}),
	getVaultPort: (options) => ({
		url: `/vault/${options?.id}/port`,
		isGlobal: true
	}),
	getWatchers: () => ({
		url: '/watchers',
		isGlobal: false
	}),
	getPlaylists: () => ({
		url: '/playlists',
		isGlobal: false
	}),
	getPlaylist: (options) => ({
		url: `/playlists/${options?.id}`,
		isGlobal: false
	}),
	getWatcher: (options) => ({
		url: `/watchers/${options?.id}`,
		isGlobal: false
	}),
	getTags: (options) => ({
		url: `/tags${options?.params ? `?${options.params}` : ''}`,
		isGlobal: false
	}),
	getTag: (options) => ({
		url: `/tags/${options?.id}`,
		isGlobal: false
	}),
	getMediaItems: (options) => ({
		url: `/media-items${options?.params ? `?${options.params}` : ''}`,
		isGlobal: false
	}),
	getMediaItemsForReview: (options) => ({
		url: `/media-items/review${options?.params ? `?${options.params}` : ''}`,
		isGlobal: false
	}),
	getMediaItem: (options) => ({
		url: `/media-items/${options?.id}${options?.params ? `?${options.params}` : ''}`,
		isGlobal: false
	}),
	getMediaItemTags: (options) => ({
		url: `/media-items/${options?.id}/tags`,
		isGlobal: false
	}),
	getApiKeys: () => ({
		url: `/settings/api-keys`,
		isGlobal: false
	}),
	getSDLoras: (options) => ({
		url: `/sd/loras${options?.params ? `?${options.params}` : ''}`,
		isGlobal: false
	}),
	getSDCheckpoints: (options) => ({
		url: `/sd/checkpoints${options?.params ? `?${options.params}` : ''}`,
		isGlobal: false
	}),
	getSDPrompts: () => ({
		url: `/sd/prompts`,
		isGlobal: false
	})
};
