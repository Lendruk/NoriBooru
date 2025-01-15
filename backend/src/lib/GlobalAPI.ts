import fs from 'fs/promises';
import { VaultController } from '../db/VaultController';
import { VaultRouter } from '../routes/global/VaultRouter';
import { getServerConfig } from '../utils/getServerConfig';
import { IoCAPI } from './IoCAPI';
import { Router } from './Router';

export class GlobalAPI extends IoCAPI {
	public constructor() {
		super();

		this.bind(VaultController).toSelf().inSingletonScope();
		this.bind(Router).to(VaultRouter).inSingletonScope();
		this.port = 8080;
	}

	public async init(): Promise<void> {
		// Check if the base vault dir exists
		const baseVaultDir = (await getServerConfig()).baseVaultDir;
		try {
			await fs.stat(baseVaultDir);
		} catch {
			console.log(`Base vault dir ${baseVaultDir} does not exist, creating it`);
			await fs.mkdir(baseVaultDir);
		}
	}
}
