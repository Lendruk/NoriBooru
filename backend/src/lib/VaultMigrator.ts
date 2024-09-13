import { sql } from 'drizzle-orm';
import fs from 'fs/promises';
import migrationFunctionMap from '../../migrations/vault';
import type { VaultInstance } from './VaultInstance';

export type MigrationFunction = (vault: VaultInstance) => Promise<void> | void;

export type Migration = {
	version: Version;
	sql?: string;
	migrationFunction?: MigrationFunction;
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

			let migrationFunction: MigrationFunction | undefined;
			try {
				migrationFunction = migrationFunctionMap[version as keyof typeof migrationFunctionMap];
			} catch {
				// No js file
			}

			if (sql || migrationFunction) {
				const migration: Migration = {
					version: version as Version,
					sql,
					migrationFunction
				};

				this.availableMigrations.push(migration);
			}
		}
	}

	public static async migrateVault(vault: VaultInstance): Promise<void> {
		const { version } = vault.getConfig();
		let nextMigration = this.getNextMigration(version);

		while (nextMigration) {
			console.log(
				`Migrating vault ${vault.name} (version ${vault.version}) to version ${nextMigration?.version}`
			);
			try {
				await this.applyMigration(vault, nextMigration);
				nextMigration = this.getNextMigration(vault.version);
			} catch (error) {
				console.log(error);
				console.log(`Failed to migrate vault ${vault.name} to version ${nextMigration?.version}`);
				await vault.saveConfig();
				break;
			}
		}
		await vault.saveConfig();
	}

	private static executeSQLMigration(db: VaultInstance['db'], sqlInput: string): void {
		const splitStatements = sqlInput.split('--- StatementBreak');
		for (const statement of splitStatements) {
			db.run(sql.raw(`${statement}`));
		}
	}

	private static async applyMigration(vault: VaultInstance, migration: Migration): Promise<void> {
		if (migration.sql) {
			this.executeSQLMigration(vault.db, migration.sql);
		}

		if (migration.migrationFunction) {
			await migration.migrationFunction(vault);
		}

		vault.version = migration.version;
	}

	private static getNextMigration(currentVersion: Version): Migration | undefined {
		const nextMigration = this.availableMigrations.find(
			(migration) => migration.version > currentVersion
		);
		return nextMigration;
	}
}
