import type { ApiEndpoint } from './services/HttpService';

type EndpointNames =
	| 'getVaults'
	| 'getWatchers'
	| 'watcher'
	| 'getTags'
	| 'mediaItemTags'
	| 'tag'
	| 'playlist'
	| 'playlists'
	| 'getApiKeys'
	| 'mediaItem'
	| 'sdLoras'
	| 'getSDPrompts'
	| 'getVaultPort'
	| 'sdCheckpoints'
	| 'getMediaItemsForReview'
	| 'wildCard'
	| 'vault'
	| 'sdPrompt'
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
	vault: (options) => ({
		url: `/vault/${options?.id}`,
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
	playlists: () => ({
		url: '/playlists',
		isGlobal: false
	}),
	playlist: (options) => ({
		url: `/playlists/${options?.id}`,
		isGlobal: false
	}),
	watcher: (options) => ({
		url: `/watchers/${options?.id}`,
		isGlobal: false
	}),
	getTags: (options) => ({
		url: `/tags${options?.params ? `?${options.params}` : ''}`,
		isGlobal: false
	}),
	tag: (options) => ({
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
	mediaItem: (options) => ({
		url: `/media-items/${options?.id}${options?.params ? `?${options.params}` : ''}`,
		isGlobal: false
	}),
	mediaItemTags: (options) => ({
		url: `/media-items/${options?.id}/tags`,
		isGlobal: false
	}),
	getApiKeys: () => ({
		url: `/settings/api-keys`,
		isGlobal: false
	}),
	sdLoras: (options) => ({
		url: `/sd/loras${options?.params ? `?${options.params}` : ''}`,
		isGlobal: false
	}),
	sdCheckpoints: (options) => ({
		url: `/sd/checkpoints${options?.params ? `?${options.params}` : ''}`,
		isGlobal: false
	}),
	getSDPrompts: () => ({
		url: `/sd/prompts`,
		isGlobal: false
	}),
	sdPrompt: (options) => ({
		url: `/sd/prompts/${options?.id ? `${options.id}` : ''}`,
		isGlobal: false
	}),
	wildCard: (options) => ({
		url: `/sd/wildcards/${options?.id ? `${options.id}` : ''}`,
		isGlobal: false
	})
};
