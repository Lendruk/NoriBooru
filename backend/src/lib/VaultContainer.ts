import { Container } from 'inversify';
import { MediaService } from '../services/MediaService';
import { TagService } from '../services/TagService';
import { VaultConfig } from '../types/VaultConfig';
import { VaultInstance } from './VaultInstance';

export class VaultContainer {
	public container: Container;

	public constructor(vaultConfig: VaultConfig) {
		this.container = new Container();
		console.log('creating container');
		this.container.bind('config').toConstantValue(vaultConfig);
		this.container.bind(TagService).toSelf().inSingletonScope();
		this.container.bind(MediaService).toSelf().inSingletonScope();
		this.container.bind(VaultInstance).toSelf().inSingletonScope();
	}

	public async init(): Promise<void> {
		await this.container.get(VaultInstance).init();
	}

	public get vault(): VaultInstance {
		return this.container.get(VaultInstance);
	}
}
