export type WatcherType = '4chan' | 'reddit' | 'discord';

export type WatcherStatus = 'running' | 'paused' | 'finished' | 'dead';

export type Watcher = {
	id: string;
	description: string;
	createdAt: number;
	totalItems: number;
	status: WatcherStatus;
	type: WatcherType;
	url: string;
	requestInterval: number;
	itemsPerRequest: number;
	itemsDownloaded: number;
	inactivityTimeout: number;
	lastRequestedAt: number;
	timeSinceNewItems: number;
};
