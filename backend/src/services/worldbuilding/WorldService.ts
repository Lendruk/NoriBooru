import { injectable } from 'inversify';
import { VaultService } from '../../lib/VaultService';

@injectable()
export class WorldServce extends VaultService {}
