import { sql } from 'drizzle-orm';
import { VaultInstance } from './VaultInstance';

export class VaultMigrator {
	private static availableMigrations: Set<string> = new Set();

	public static async init(): Promise<void> {}

	public static async migrateVault(vault: VaultInstance): Promise<void> {
		// const { version } = vault.getConfig();
	}

	public static async executeSQLMigration(
		db: VaultInstance['db'],
		sqlInput: string
	): Promise<void> {
		const splitStatements = sqlInput.split('--- StatementBreak');
		for (const statement of splitStatements) {
			db.run(sql.raw(`${statement}`));
		}
	}
}
