import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { activeWatchers, ActiveWatcherSchema } from '../../db/vault/schema';
import { VaultInstance } from '../VaultInstance';
import { ActiveWatcher } from './ActiveWatcher';
import { PageParserFactory } from './WatcherFactory';
import { WatcherSource } from './WatcherSource';

const getSourceFromUrl = (url: string): WatcherSource => {
	if (url.includes('4chan.org')) {
		return '4chan';
	}
	throw new Error('Invalid url');
};

export class PageWatcherService {
	private watchers: ActiveWatcher[] = [];

	public constructor(private vault: VaultInstance) {}

	public async init(): Promise<void> {
		console.log('PageWatcherService::init: called...');
		const { db } = this.vault;
		const rawWatchers = await db.query.activeWatchers.findMany();
		for (const rawWatcher of rawWatchers) {
			const activeWatcher = PageParserFactory.createParser(
				this.vault,
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
		const { db } = this.vault;
		const rawWatcher = (
			await db
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

		const activeWatcher = PageParserFactory.createParser(this.vault, source, rawWatcher);
		this.watchers.push(activeWatcher);
		void activeWatcher.start();

		return activeWatcher;
	}

	public async pauseWatcher(watcherId: string): Promise<void> {
		const watcher = this.watchers.find((watcher) => watcher.id === watcherId);
		if (watcher) {
			await watcher.pause();
		}
	}

	public async deleteWatcher(watcherId: string): Promise<void> {
		const index = this.watchers.findIndex((watcher) => watcher.id === watcherId);
		if (index !== -1) {
			const watcher = this.watchers.splice(index, 1)[0];

			if (watcher.status === 'running') {
				await watcher.pause();
			}

			await this.vault.db.delete(activeWatchers).where(eq(activeWatchers.id, watcher.id));
		}
	}
}
