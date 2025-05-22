import { injectable } from 'inversify';
import { VaultDb } from './VaultAPI';

@injectable()
export abstract class VaultService {
	public constructor(protected db: VaultDb) {}
}
