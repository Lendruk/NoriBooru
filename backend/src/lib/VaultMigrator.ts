import { sql } from 'drizzle-orm';
import fs from 'fs/promises';
import { injectable } from 'inversify';
import migrationFunctionMap from '../../migrations/vault';
import { VaultConfigService } from '../services/VaultConfigService';
import { VaultAPI, VaultDb } from './VaultAPI';

export type MigrationFunction = (vault: VaultAPI) => Promise<void> | void;

export type Migration = {
	version: Version;
	sql?: string;
	migrationFunction?: MigrationFunction;
};

export type Version = `${number}.${number}.${number}`;

@injectable()
export class VaultMigrator {
	private availableMigrations: Migration[] = [];
	private migrationDir = `${process.cwd()}/migrations/vault`;

	public async init(): Promise<void> {
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

	public async migrateVault(vault: VaultAPI): Promise<void> {
		const { version, name } = vault.getConfig();
		let nextMigration = this.getNextMigration(version);
		const configService = vault.get(VaultConfigService);

		while (nextMigration) {
			console.log(
				`Migrating vault ${name} (version ${version}) to version ${nextMigration?.version}`
			);
			try {
				await this.applyMigration(vault, nextMigration);
				nextMigration = this.getNextMigration(nextMigration.version);
			} catch (error) {
				console.log(error);
				console.log(`Failed to migrate vault ${name} to version ${nextMigration?.version}`);
				await configService.saveConfig();
				break;
			}
		}
		await configService.saveConfig();
	}

	private executeSQLMigration(db: VaultDb, sqlInput: string): void {
		const splitStatements = sqlInput.split('--- StatementBreak');
		for (const statement of splitStatements) {
			db.run(sql.raw(`${statement}`));
		}
	}

	private async applyMigration(vault: VaultAPI, migration: Migration): Promise<void> {
		if (migration.sql) {
			this.executeSQLMigration(vault.getDb(), migration.sql);
		}

		if (migration.migrationFunction) {
			await migration.migrationFunction(vault);
		}

		vault.getConfig().version = migration.version;
	}

	private getNextMigration(currentVersion: Version): Migration | undefined {
		const nextMigration = this.availableMigrations.find(
			(migration) => migration.version > currentVersion
		);
		return nextMigration;
	}
}
