import fs from 'fs/promises';
import { inject, injectable } from 'inversify';
import { Version } from '../lib/VaultMigrator';
import { VaultConfig } from '../types/VaultConfig';

@injectable()
export class VaultConfigService implements VaultConfig {
	public id: string;
	public name: string;
	public path: string;
	public createdAt: number;
	public hasInstalledSD: boolean;
	public version: Version;
	public civitaiApiKey: string | null;

	public constructor(@inject('config') vault: VaultConfig) {
		this.id = vault.id;
		this.name = vault.name;
		this.path = vault.path;
		this.version = vault.version;
		this.createdAt = vault.createdAt;
		this.hasInstalledSD = vault.hasInstalledSD;
		this.civitaiApiKey = vault.civitaiApiKey;
	}

	public async setName(name: string): Promise<void> {
		this.name = name;
		await this.saveConfig();
	}

	public async setCivitaiApiKey(key: string): Promise<void> {
		this.civitaiApiKey = key;
		await this.saveConfig();
	}

	public getConfig(): VaultConfig {
		return {
			id: this.id,
			name: this.name,
			path: this.path,
			createdAt: this.createdAt,
			hasInstalledSD: this.hasInstalledSD,
			civitaiApiKey: this.civitaiApiKey,
			version: this.version
		};
	}

	public async saveConfig(): Promise<void> {
		await fs.writeFile(
			`${this.path}/vault.config.json`,
			JSON.stringify(
				{
					id: this.id,
					name: this.name,
					path: this.path,
					createdAt: this.createdAt,
					hasInstalledSD: this.hasInstalledSD,
					civitaiApiKey: this.civitaiApiKey,
					version: this.version
				} satisfies VaultConfig,
				null,
				2
			)
		);
	}
}
