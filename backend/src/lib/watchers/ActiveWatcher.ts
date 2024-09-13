import { eq } from 'drizzle-orm';
import { activeWatchers, ActiveWatcherSchema } from '../../db/vault/schema';
import type { VaultInstance } from '../VaultInstance';
import { WatcherSource } from './WatcherSource';

export abstract class ActiveWatcher<T = unknown> implements ActiveWatcherSchema {
	protected instanceData!: T extends undefined ? undefined : T;
	public id: string;
	public description: string | null;
	public data: string | null;
	public itemsPerRequest: number;
	public itemsDownloaded: number;
	public totalItems: number | null;
	public url: string;
	public requestInterval: number;
	public lastRequestedAt: number;
	public createdAt: number;
	public status: 'paused' | 'running' | 'finished' | 'dead';
	public type: WatcherSource;
	public inactivityTimeout: number;
	public timeSinceNewItems: number;

	private timer: NodeJS.Timeout | undefined;

	public constructor(
		rawWatcher: ActiveWatcherSchema,
		protected vault: VaultInstance
	) {
		this.id = rawWatcher.id;
		this.description = rawWatcher.description;
		this.data = rawWatcher.data;
		this.itemsPerRequest = rawWatcher.itemsPerRequest;
		this.itemsDownloaded = rawWatcher.itemsDownloaded;
		this.totalItems = rawWatcher.totalItems;
		this.url = rawWatcher.url;
		this.requestInterval = rawWatcher.requestInterval;
		this.lastRequestedAt = rawWatcher.lastRequestedAt;
		this.createdAt = rawWatcher.createdAt;
		this.timeSinceNewItems = rawWatcher.timeSinceNewItems;
		this.inactivityTimeout = rawWatcher.inactivityTimeout;
		this.status = rawWatcher.status as ActiveWatcher['status'];
		this.type = rawWatcher.type as ActiveWatcher['type'];
	}

	public async start(): Promise<void> {
		this.status = 'running';
		await this.save();
		await this.queryPage();

		this.timer = setInterval(async () => {
			if (this.status === 'running') {
				await this.queryPage();
			} else {
				clearInterval(this.timer);
			}
		}, this.requestInterval);
	}

	public async pause(): Promise<void> {
		clearInterval(this.timer);
		this.status = 'paused';
		await this.save();
	}

	public async stop(): Promise<void> {
		clearInterval(this.timer);
		this.status = 'finished';
		await this.save();
	}

	public abstract queryPage(): Promise<void>;

	public async save(): Promise<void> {
		await this.vault.db
			.update(activeWatchers)
			.set({
				data: JSON.stringify(this.instanceData),
				status: this.status,
				description: this.description,
				lastRequestedAt: this.lastRequestedAt,
				itemsDownloaded: this.itemsDownloaded,
				timeSinceNewItems: this.timeSinceNewItems,
				totalItems: this.totalItems
			})
			.where(eq(activeWatchers.id, this.id));
		this.notity();
	}

	protected notity(): void {
		this.vault.broadcastEvent({ event: 'watcher-update', data: { id: this.id } });
	}

	public toSchema(): ActiveWatcherSchema {
		return {
			id: this.id,
			description: this.description,
			createdAt: this.createdAt,
			data: this.data,
			itemsPerRequest: this.itemsPerRequest,
			itemsDownloaded: this.itemsDownloaded,
			lastRequestedAt: this.lastRequestedAt,
			requestInterval: this.requestInterval,
			status: this.status,
			totalItems: this.totalItems,
			type: this.type,
			url: this.url,
			inactivityTimeout: this.inactivityTimeout,
			timeSinceNewItems: this.timeSinceNewItems
		};
	}
}
