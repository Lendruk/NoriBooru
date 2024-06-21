import Database from 'better-sqlite3';
import type { Vault } from './master/schema';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as vaultSchema from './vault/schema';

export type VaultDb = BetterSQLite3Database<typeof vaultSchema>;

export type VaultInstance = Vault & { db: VaultDb }; 

export class VaultController {
	public static vaults: Map<string, VaultInstance> = new Map();

	public static async registerVault(vault: Vault) {
		// Create db connection
		const newDb = new Database(`${vault.path}/vault.sqlite`);
		const db = drizzle(newDb, { schema: vaultSchema });
		await migrate(db, { migrationsFolder: 'migrations/vault' });
		this.vaults.set(vault.id, { ...vault, db });
	}
  
	public static getVault(vaultId: string) {
		const vault = this.vaults.get(vaultId);
		if (!vault) {
			throw new Error('Vault not found');
		}
		return vault;
	}
}