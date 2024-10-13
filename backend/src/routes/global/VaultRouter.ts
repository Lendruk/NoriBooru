import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { FastifyReply, FastifyRequest } from 'fastify';
import fs from 'fs/promises';
import { inject, injectable } from 'inversify';
import path from 'path';
import { masterDb } from '../../db/master/db';
import { vaults } from '../../db/master/schema';
import { VaultController } from '../../db/VaultController';
import { Route, Router } from '../../lib/Router';
import { VaultConfig } from '../../types/VaultConfig';
import { getServerConfig } from '../../utils/getServerConfig';

@injectable()
export class VaultRouter extends Router {
	public constructor(@inject(VaultController) private readonly vaultController: VaultController) {
		super();
	}

	@Route.GET('/vaults')
	public async getVaults() {
		const fetchedVaults = await masterDb.query.vaults.findMany();
		const relativeVaultDirPath = (await getServerConfig()).baseVaultDir;
		const absoluteVaultDirPath = path.join(process.cwd(), relativeVaultDirPath);

		const vaultsWithConfig: VaultConfig[] = [];
		for (const vault of fetchedVaults) {
			try {
				const vaultData = JSON.parse(
					(await fs.readFile(`${vault.path}/vault.config.json`)).toString()
				) as VaultConfig;
				vaultsWithConfig.push(vaultData);
			} catch {
				// No vault config - prune unexistent vault
				await masterDb.delete(vaults).where(eq(vaults.id, vault.id));
			}
		}
		return {
			vaults: vaultsWithConfig,
			baseVaultDir: absoluteVaultDirPath
		};
	}

	@Route.POST('/vaults')
	public async createVault(request: FastifyRequest, reply: FastifyReply) {
		const body = request.body as { path?: string; name: string };
		const starterVersion = '0.0.0';
		const vaultPath = body.path as string;

		if (vaultPath) {
			try {
				const stats = await fs.stat(vaultPath);
				if (!stats.isDirectory()) {
					return reply.status(400).send({ message: 'Path is not a directory' });
				}

				const dirContent = await fs.readdir(vaultPath);
				if (dirContent.length > 0) {
					return reply.status(400).send({ message: 'Directory must be empty' });
				}
			} catch (err) {
				await fs.mkdir(vaultPath);
			}
		}

		const newVault = await masterDb
			.insert(vaults)
			.values({
				id: randomUUID(),
				path: body.path ?? (await getServerConfig()).baseVaultDir
			})
			.returning();

		await fs.mkdir(`${vaultPath}/media`);
		await fs.mkdir(`${vaultPath}/media/images`);
		await fs.mkdir(`${vaultPath}/media/images/.thumb`);
		await fs.mkdir(`${vaultPath}/media/videos`);
		await fs.mkdir(`${vaultPath}/media/videos/.thumb`);

		const vaultConfig: VaultConfig = {
			id: newVault[0].id,
			name: body.name,
			path: vaultPath,
			createdAt: Date.now(),
			version: starterVersion,
			hasInstalledSD: false,
			civitaiApiKey: null
		};
		await fs.writeFile(`${vaultPath}/vault.config.json`, JSON.stringify(vaultConfig, null, 2));
		await this.vaultController.registerVault(newVault[0]);
		return reply.send(vaultConfig);
	}

	@Route.DELETE('/vaults/:id')
	public async deleteVault(request: FastifyRequest, reply: FastifyReply) {
		const params = request.params as { id: string };

		const vaultPath = (await masterDb.query.vaults.findFirst({ where: eq(vaults.id, params.id) }))
			?.path;

		if (vaultPath) {
			await fs.rm(vaultPath, { recursive: true, force: true });
			await masterDb.delete(vaults).where(eq(vaults.id, params.id));
		}
		return reply.send({ message: 'Vault deleted successfully' });
	}

	@Route.POST('/vaults/check-path')
	public async checkVaultPath(request: FastifyRequest, reply: FastifyReply) {
		const body = request.body as { path: string; checkingForExistingVault?: boolean };
		if (body.path == '') {
			return reply.status(400).send({ message: 'Path cannot be empty' });
		}
		console.log(body.path);
		const isAbsolute = path.isAbsolute(body.path);
		if (isAbsolute) {
			try {
				const dirContent = await fs.readdir(body.path);
				if (dirContent.length > 0) {
					if (body.checkingForExistingVault) {
						if (
							dirContent.includes('vault.sqlite') &&
							dirContent.includes('vault.config.json') &&
							dirContent.includes('media')
						) {
							return reply.status(200).send({ message: 'Directory is a valid vault' });
						} else {
							return reply.status(400).send({ message: 'Directory is not a valid vault' });
						}
					} else {
						return reply.status(400).send({ message: 'Directory must be empty' });
					}
				}
			} catch {
				if (body.checkingForExistingVault) {
					return reply.status(400).send({ message: 'Directory is not a valid vault' });
				} else {
					return reply.status(200).send({ message: 'A new directory will be created' });
				}
			}
		} else {
			return reply.status(400).send({ message: 'Path must be absolute' });
		}

		return reply.send({ message: 'Path is valid' });
	}

	@Route.GET('/vaults/:id/port')
	public async getVaultPort(request: FastifyRequest, reply: FastifyReply) {
		const { id } = request.params as { id: string };
		let port: number | undefined;

		if (!this.vaultController.vaults.has(id)) {
			const vault = await masterDb.query.vaults.findFirst({
				where: eq(vaults.id, id)
			});

			if (!vault) {
				return reply.status(404).send({ message: 'Vault not found' });
			}
			const api = await this.vaultController.registerVault(vault);
			port = api.getPort();
		} else {
			port = this.vaultController.vaults.get(id)?.getPort();
		}

		return reply.send({ port });
	}

	@Route.POST('/vaults/import')
	public async importVault(request: FastifyRequest, reply: FastifyReply) {
		const body = request.body as { path: string };
		const vault = await masterDb.query.vaults.findFirst({
			where: eq(vaults.path, body.path)
		});

		if (!vault) {
			let vaultData: VaultConfig;
			try {
				const rawVaultData = (await fs.readFile(`${body.path}/vault.config.json`)).toString();
				vaultData = JSON.parse(rawVaultData) as VaultConfig;
			} catch {
				return reply.status(400).send({ message: 'Path is not a valid vault' });
			}

			await masterDb.insert(vaults).values(vaultData);
			await this.vaultController.registerVault(vaultData);
			return reply.send(vaultData);
		} else {
			return reply.status(400).send({ message: 'Vault already exists' });
		}
	}

	@Route.POST('/vaults/:id/unlink')
	public async unlinkVault(request: FastifyRequest, reply: FastifyReply) {
		const { id } = request.params as { id: string };

		const vaultPath = (await masterDb.query.vaults.findFirst({ where: eq(vaults.id, id) }))?.path;

		if (vaultPath) {
			await masterDb.delete(vaults).where(eq(vaults.id, id));
		}
		return reply.send({ message: 'Vault unlinked successfully' });
	}
}
