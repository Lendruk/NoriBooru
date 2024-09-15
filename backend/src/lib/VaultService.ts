import { injectable } from 'inversify';
import { VaultDb } from './VaultInstance';

@injectable()
export abstract class VaultService {
	public constructor(protected db: VaultDb) {}
}
