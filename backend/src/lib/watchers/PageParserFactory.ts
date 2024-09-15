import { inject, injectable } from 'inversify';
import { ActiveWatcherSchema } from '../../db/vault/schema';
import { MediaService } from '../../services/MediaService';
import { WebsocketService } from '../../services/WebsocketService';
import type { VaultDb } from '../VaultInstance';
import { ActiveWatcher } from './ActiveWatcher';
import { FourChanWatcher } from './FourChanWatcher';
import { RedditWatcher } from './RedditWatcher';
import { WatcherSource } from './WatcherSource';

@injectable()
export class PageParserFactory {
	public constructor(
		@inject('db') private db: VaultDb,
		@inject(MediaService) private mediaService: MediaService,
		@inject(WebsocketService) private websocketService: WebsocketService
	) {}

	public createParser(
		source: WatcherSource,
		rawWatcher: ActiveWatcherSchema
	): ActiveWatcher<unknown> {
		switch (source) {
			case '4chan':
				return new FourChanWatcher(rawWatcher, this.db, this.websocketService, this.mediaService);
			case 'reddit':
				return new RedditWatcher(rawWatcher, this.db, this.websocketService, this.mediaService);
			default:
				throw new Error('Invalid source');
		}
	}
}
