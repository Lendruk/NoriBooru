import { ActiveWatcher } from '../../db/vault/schema';
import { Queriable } from './Queriable';

export class FourChanParser implements Queriable {
	public async queryPage(watcher: ActiveWatcher): Promise<void> {
		// const response = await fetch(watcher.url);
		// const body = await response.text();

		console.log('Querying 4chan');
	}
}
