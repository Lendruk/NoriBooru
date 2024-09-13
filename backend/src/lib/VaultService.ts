import { VaultInstance } from './VaultInstance';

export abstract class VaultService {
	public constructor(protected vault: VaultInstance) {}
}
