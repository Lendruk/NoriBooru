import { ActiveWatcher } from '../../db/vault/schema';

export interface Queriable {
	queryPage(watcher: ActiveWatcher): Promise<void>;
}
