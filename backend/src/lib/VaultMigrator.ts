import { sql } from 'drizzle-orm';
import fs from 'fs/promises';
import { VaultBase } from './VaultBase';

export type Migration = {
	version: Version;
	sql?: string;
	js?: string;
};

export type Version = `${number}.${number}.${number}`;

export class VaultMigrator {
	private static availableMigrations: Migration[] = [];
	private static migrationDir = `${process.cwd()}/migrations/vault`;

	public static async init(): Promise<void> {
		const versions = await fs.readdir(this.migrationDir);
		for (const version of versions) {
			// We dont want the init.sql file
			if (version === 'init.sql') {
				continue;
			}
			let sql: string | undefined;

			try {
				sql = (await fs.readFile(`${this.migrationDir}/${version}/migration.sql`)).toString();
			} catch {
				// No sql file
			}

			let js: string | undefined;
			try {
				js = (await fs.readFile(`${this.migrationDir}/${version}/migration.js`)).toString();
			} catch {
				// No js file
			}

			const migration: Migration = {
				version: version as Version,
				sql,
				js
			};

			this.availableMigrations.push(migration);
		}
	}

	public static async migrateVault(vault: VaultBase): Promise<void> {
		const { version } = vault.getConfig();
		let nextMigration = this.getNextMigration(version);

		console.log(
			`Migrating vault ${vault.name} (version ${vault.version}) to version ${nextMigration?.version}`
		);

		while (nextMigration) {
			await this.applyMigration(vault, nextMigration);
			nextMigration = this.getNextMigration(nextMigration.version);
		}
	}

	public static executeSQLMigration(db: VaultBase['db'], sqlInput: string): void {
		const splitStatements = sqlInput.split('--- StatementBreak');
		for (const statement of splitStatements) {
			db.run(sql.raw(`${statement}`));
		}
	}

	private static async applyMigration(vault: VaultBase, migration: Migration): Promise<void> {
		if (migration.sql) {
			this.executeSQLMigration(vault.db, migration.sql);
		}

		// if (migration.js) {
		// 	// eslint-disable-next-line @typescript-eslint/no-var-requires
		// 	const migrationModule = require(migration.js);
		// 	migrationModule(vault);
		// }

		vault.version = migration.version;
		await vault.saveConfig();
	}

	private static getNextMigration(currentVersion: Version): Migration | undefined {
		const nextMigration = this.availableMigrations.find(
			(migration) => migration.version > currentVersion
		);
		return nextMigration;
	}
}