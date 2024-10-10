import type { ApiEndpoint } from './services/HttpService';

type EndpointNames =
	| 'vaults'
	| 'watchers'
	| 'watcher'
	| 'tags'
	| 'mediaItemTags'
	| 'tag'
	| 'playlist'
	| 'playlists'
	| 'getApiKeys'
	| 'mediaItem'
	| 'sdLoras'
	| 'sdPrompts'
	| 'getVaultPort'
	| 'sdCheckpoints'
	| 'getMediaItemsForReview'
	| 'wildCard'
	| 'vault'
	| 'sdPrompt'
	| 'pauseWatcher'
	| 'resumeWatcher'
	| 'autoTagMediaItem'
	| 'addPlaylistItem'
	| 'stopSDUi'
	| 'maskSDInactive'
	| 'wildCards'
	| 'sdSamplers'
	| 'sdSchedulers'
	| 'sdUpscalers'
	| 'sdStart'
	| 'sdInterrupt'
	| 'registerCivitaiAPIKey'
	| 'sdUninstall'
	| 'sdInstall'
	| 'unlinkVault'
	| 'refreshCheckpoints'
	| 'unloadCheckpoint'
	| 'refreshSDLoras'
	| 'checkVaultPath'
	| 'importVault'
	| 'mediaItems';

type Endpoints = {
	[key in EndpointNames]: (options?: {
		id?: string | number;
		params?: string | URLSearchParams;
	}) => ApiEndpoint;
};

export const endpoints: Endpoints = {
	vaults: () => ({
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
	watchers: () => ({
		url: '/watchers',
		isGlobal: false
	}),
	addPlaylistItem: (options) => ({
		url: `/playlists/${options?.id ? `${options.id}` : ''}/add-item`,
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
	tags: (options) => ({
		url: `/tags${options?.params ? `?${options.params}` : ''}`,
		isGlobal: false
	}),
	tag: (options) => ({
		url: `/tags/${options?.id}`,
		isGlobal: false
	}),
	mediaItems: (options) => ({
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
	sdPrompts: () => ({
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
	}),
	wildCards: () => ({
		url: `/sd/wildcards`,
		isGlobal: false
	}),
	pauseWatcher: (options) => ({
		url: `/watchers/${options?.id ? `${options.id}` : ''}/pause`,
		isGlobal: false
	}),
	resumeWatcher: (options) => ({
		url: `/watchers/${options?.id ? `${options.id}` : ''}/resume`,
		isGlobal: false
	}),
	autoTagMediaItem: (options) => ({
		url: `/media-items/${options?.id ? `${options.id}` : ''}/auto-tag`,
		isGlobal: false
	}),
	stopSDUi: () => ({
		url: `/sd op`,
		isGlobal: false
	}),
	maskSDInactive: () => ({
		url: `/sd/inactive`,
		isGlobal: false
	}),
	sdSamplers: () => ({
		url: `/sd/samplers`,
		isGlobal: false
	}),
	sdSchedulers: () => ({
		url: `/sd/schedulers`,
		isGlobal: false
	}),
	sdUpscalers: () => ({
		url: `/sd/highres/upscalers`,
		isGlobal: false
	}),
	sdStart: () => ({
		url: `/sd/start`,
		isGlobal: false
	}),
	sdInterrupt: () => ({
		url: `/sd/interrupt`,
		isGlobal: false
	}),
	registerCivitaiAPIKey: () => ({
		url: `/sd/civitai/register`,
		isGlobal: false
	}),
	sdUninstall: () => ({
		url: `/sd/uninstall`,
		isGlobal: false
	}),
	sdInstall: () => ({
		url: `/sd/install`,
		isGlobal: false
	}),
	unlinkVault: () => ({
		url: `/vault/unlink`,
		isGlobal: true
	}),
	refreshCheckpoints: () => ({
		url: `/sd/refresh-checkpoints`,
		isGlobal: false
	}),
	refreshSDLoras: () => ({
		url: `/sd/refresh-loras`,
		isGlobal: false
	}),
	unloadCheckpoint: () => ({
		url: '/sd/unload-checkpoint',
		isGlobal: false
	}),
	checkVaultPath: () => ({
		url: `/vault/check-path`,
		isGlobal: true
	}),
	importVault: () => ({
		url: `/vault/import`,
		isGlobal: true
	})
};
