import { ActiveWatcherSchema } from '../../db/vault/schema';
import { VaultInstance } from '../VaultInstance';
import { ActiveWatcher } from './ActiveWatcher';
import { FourChanWatcher } from './FourChanWatcher';
import { WatcherSource } from './WatcherSource';

export class PageParserFactory {
	public static createParser(
		vault: VaultInstance,
		source: WatcherSource,
		rawWatcher: ActiveWatcherSchema
	): ActiveWatcher {
		switch (source) {
			case '4chan':
				return new FourChanWatcher(rawWatcher, vault);
			default:
				throw new Error('Invalid source');
		}
	}
}
