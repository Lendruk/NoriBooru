export type Watcher = {
	id: string;
	description: string;
	createdAt: number;
	totalItems: number;
	status: 'running' | 'paused' | 'finished' | 'dead';
	type: '4chan' | 'reddit' | 'discord';
	url: string;
	requestInterval: number;
	itemsPerRequest: number;
	itemsDownloaded: number;
	inactivityTimeout: number;
	lastRequestedAt: number;
	timeSinceNewItems: number;
};
