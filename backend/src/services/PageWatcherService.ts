import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { inject, injectable } from 'inversify';
import { activeWatchers, ActiveWatcherSchema } from '../db/vault/schema';
import type { VaultDb } from '../lib/VaultInstance';
import { VaultService } from '../lib/VaultService';
import { ActiveWatcher } from '../lib/watchers/ActiveWatcher';
import { PageParserFactory } from '../lib/watchers/PageParserFactory';
import { WatcherSource } from '../lib/watchers/WatcherSource';

const getSourceFromUrl = (url: string): WatcherSource => {
	if (url.includes('4chan.org')) {
		return '4chan';
	} else if (url.includes('reddit.com')) {
		return 'reddit';
	}
	throw new Error('Invalid url');
};

@injectable()
export class PageWatcherService extends VaultService {
	private watchers: ActiveWatcher[] = [];

	public constructor(
		@inject('db') vaultDb: VaultDb,
		@inject(PageParserFactory) private parserFactory: PageParserFactory
	) {
		super(vaultDb);
	}

	public async init(): Promise<void> {
		console.log('PageWatcherService::init: called...');
		const rawWatchers = await this.db.query.activeWatchers.findMany();
		for (const rawWatcher of rawWatchers) {
			const activeWatcher = this.parserFactory.createParser(
				getSourceFromUrl(rawWatcher.url),
				rawWatcher
			);
			this.watchers.push(activeWatcher);

			if (activeWatcher.status === 'running') {
				// We dont need to wait for the watcher startup
				// That would block the first request done to this vault
				void activeWatcher.start();
			}
		}
	}

	public getWatchers(): ActiveWatcherSchema[] {
		const mappedWatchers: ActiveWatcherSchema[] = [];
		for (const watcher of this.watchers) {
			mappedWatchers.push(watcher.toSchema());
		}
		return mappedWatchers;
	}

	public getWatcher(watcherId: string): ActiveWatcherSchema {
		const watcher = this.watchers.find((watcher) => watcher.id === watcherId)?.toSchema();

		if (!watcher) {
			throw new Error('Watcher not found');
		}

		return watcher;
	}
	public isThereWatcherWithUrl(url: string): boolean {
		return this.watchers.find((watcher) => watcher.url === url) !== undefined;
	}

	public async createWatcher(
		url: string,
		description: string,
		requestInterval: number,
		itemsPerRequest: number,
		inactivityTimeout: number
	): Promise<ActiveWatcher> {
		const source = getSourceFromUrl(url);
		const rawWatcher = (
			await this.db
				.insert(activeWatchers)
				.values({
					description: description,
					createdAt: Date.now(),
					id: randomUUID(),
					status: 'running',
					type: source,
					url,
					requestInterval,
					itemsPerRequest,
					inactivityTimeout,
					data: null
				} as ActiveWatcher)
				.returning()
		)[0];

		const activeWatcher = this.parserFactory.createParser(source, rawWatcher);
		this.watchers.push(activeWatcher);
		void activeWatcher.start();

		return activeWatcher;
	}

	public async updateWatcher(
		watcherId: string,
		description: string,
		requestInterval: number,
		itemsPerRequest: number,
		inactivityTimeout: number
	): Promise<ActiveWatcher> {
		const watcher = this.watchers.find((watcher) => watcher.id === watcherId);
		if (watcher) {
			watcher.description = description;
			watcher.requestInterval = requestInterval;
			watcher.itemsPerRequest = itemsPerRequest;
			watcher.inactivityTimeout = inactivityTimeout;
			await watcher.save();
			return watcher;
		} else {
			throw new Error('Watcher not found');
		}
	}

	public async pauseWatcher(watcherId: string): Promise<void> {
		const watcher = this.watchers.find((watcher) => watcher.id === watcherId);
		if (watcher) {
			await watcher.pause();
		}
	}

	public async resumeWatcher(watcherId: string): Promise<void> {
		const watcher = this.watchers.find((watcher) => watcher.id === watcherId);
		if (watcher && watcher.status === 'paused') {
			await watcher.start();
		}
	}

	public async deleteWatcher(watcherId: string): Promise<void> {
		const index = this.watchers.findIndex((watcher) => watcher.id === watcherId);
		if (index !== -1) {
			const watcher = this.watchers.splice(index, 1)[0];

			if (watcher.status === 'running') {
				await watcher.pause();
			}

			await this.db.delete(activeWatchers).where(eq(activeWatchers.id, watcher.id));
		}
	}
}
