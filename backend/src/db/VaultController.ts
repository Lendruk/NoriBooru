import { eq } from 'drizzle-orm';
import { type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import fs from 'fs/promises';
import { VaultContainer } from '../lib/VaultContainer';
import { VaultInstance } from '../lib/VaultInstance';
import { VaultConfig } from '../types/VaultConfig';
import { masterDb } from './master/db';
import { vaults, type Vault } from './master/schema';
import * as vaultSchema from './vault/schema';

export type VaultDb = BetterSQLite3Database<typeof vaultSchema>;

export class VaultController {
	public static vaults: Map<string, VaultContainer> = new Map();

	public static async registerVault(vault: Vault | string): Promise<VaultInstance> {
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
		const vaultContainer = new VaultContainer(vaultConfig);
		await vaultContainer.init();
		this.vaults.set(vault.id, vaultContainer);
		return vaultContainer.vault;
	}

	public static getVault(vaultId: string): VaultInstance {
		const vaultContainer = this.vaults.get(vaultId);
		if (!vaultContainer) {
			throw new Error('Vault not found');
		}
		return vaultContainer.vault;
	}
}
