import fs from 'fs/promises';
import { inject, injectable } from 'inversify';
import { VaultConfig } from '../types/VaultConfig';

@injectable()
export class VaultConfigService {
	public constructor(@inject('config') private config: VaultConfig) {}

	public getConfig(): VaultConfig {
		return this.config;
	}

	public async setConfigValue<K extends keyof VaultConfig>(
		key: K,
		value: VaultConfig[K],
		shouldSave: boolean = false
	): Promise<void> {
		this.config[key] = value;
		if (shouldSave) {
			await this.saveConfig();
		}
	}

	public async saveConfig(): Promise<void> {
		await fs.writeFile(
			`${this.config.path}/vault.config.json`,
			JSON.stringify(
				{
					id: this.config.id,
					name: this.config.name,
					path: this.config.path,
					createdAt: this.config.createdAt,
					civitaiApiKey: this.config.civitaiApiKey,
					version: this.config.version
				} satisfies VaultConfig,
				null,
				2
			)
		);
	}
}
