import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import { VaultAPI } from '../lib/VaultAPI';
import { VaultConfig } from '../types/VaultConfig';
import { masterDb } from './master/db';
import { vaults, type Vault } from './master/schema';

export class VaultController {
	public static vaults: Map<string, VaultAPI> = new Map();

	public static async registerVault(vault: Vault | string): Promise<VaultAPI> {
		if (typeof vault === 'string') {
			const result = await masterDb.query.vaults.findFirst({
				where: eq(vaults.id, vault)
			});

			if (!result) {
				throw new Error(`Vault with id ${vault} not found`);
			}
			vault = result;
		}

		const vaultConfig = JSON.parse(
			(await fs.readFile(`${vault.path}/vault.config.json`)).toString()
		) as VaultConfig;
		const vaultInstance = new VaultAPI(vaultConfig);
		await vaultInstance.init();
		this.vaults.set(vault.id, vaultInstance);
		return vaultInstance;
	}

	public static getVault(vaultId: string): VaultAPI {
		const vaultInstance = this.vaults.get(vaultId);
		if (!vaultInstance) {
			throw new Error('Vault not found');
		}
		return vaultInstance;
	}
}
