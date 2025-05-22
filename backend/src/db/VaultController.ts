import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import { injectable } from 'inversify';
import path from 'path';
import { VaultAPI } from '../lib/VaultAPI';
import { VaultConfig } from '../types/VaultConfig';
import { getServerConfig } from '../utils/getServerConfig';
import { masterDb } from './master/db';
import { vaults, type Vault } from './master/schema';

@injectable()
export class VaultController {
	public vaults: Map<string, VaultAPI> = new Map();

	public async createVault(name: string, vaultPath?: string): Promise<VaultConfig> {
		const starterVersion = '0.0.0';
		if (vaultPath) {
			try {
				const stats = await fs.stat(vaultPath);
				if (!stats.isDirectory()) {
					throw new Error('Path is not a directory');
				}

				const dirContent = await fs.readdir(vaultPath);
				if (dirContent.length > 0) {
					throw new Error('Directory must be empty');
				}
			} catch (err) {
				await fs.mkdir(vaultPath);
			}
		} else {
			vaultPath = path.join((await getServerConfig()).baseVaultDir, name);
		}

		const newVault = (
			await masterDb
				.insert(vaults)
				.values({
					id: randomUUID(),
					path: vaultPath
				})
				.returning()
		)[0];

		await fs.mkdir(`${vaultPath}/media`);
		await fs.mkdir(`${vaultPath}/media/images`);
		await fs.mkdir(`${vaultPath}/media/images/.thumb`);
		await fs.mkdir(`${vaultPath}/media/videos`);
		await fs.mkdir(`${vaultPath}/media/videos/.thumb`);
		await fs.mkdir(`${vaultPath}/sd`);
		await fs.mkdir(`${vaultPath}/sd/checkpoints`);
		await fs.mkdir(`${vaultPath}/sd/loras`);
		await fs.mkdir(`${vaultPath}/sd/diffusers_cache`);
		await fs.mkdir(`${vaultPath}/sd/diffusers_cache/checkpoints`);
		await fs.mkdir(`${vaultPath}/sd/diffusers_cache/loras`);

		const vaultConfig: VaultConfig = {
			id: newVault.id,
			name,
			path: vaultPath,
			createdAt: Date.now(),
			version: starterVersion,
			civitaiApiKey: null
		};
		await fs.writeFile(`${vaultPath}/vault.config.json`, JSON.stringify(vaultConfig, null, 2));

		return vaultConfig;
	}

	public async registerVault(vault: Vault | string): Promise<VaultAPI> {
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

	public getVault(vaultId: string): VaultAPI {
		const vaultInstance = this.vaults.get(vaultId);
		if (!vaultInstance) {
			throw new Error('Vault not found');
		}
		return vaultInstance;
	}
}
