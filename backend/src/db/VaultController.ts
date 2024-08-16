import { eq } from 'drizzle-orm';
import { type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import fs from 'fs/promises';
import { VaultInstance } from '../lib/VaultInstance';
import { VaultConfig } from '../types/VaultConfig';
import { masterDb } from './master/db';
import { vaults, type Vault } from './master/schema';
import * as vaultSchema from './vault/schema';

export type VaultDb = BetterSQLite3Database<typeof vaultSchema>;

export class VaultController {
	public static vaults: Map<string, VaultInstance> = new Map();

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
		const vaultInstance = new VaultInstance(vaultConfig);
		await vaultInstance.init();
		this.vaults.set(vault.id, vaultInstance);
		return vaultInstance;
	}

	public static getVault(vaultId: string) {
		const vault = this.vaults.get(vaultId);
		if (!vault) {
			throw new Error('Vault not found');
		}
		return vault;
	}
}
