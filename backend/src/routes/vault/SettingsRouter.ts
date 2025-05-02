import { FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { Route, Router } from '../../lib/Router';
import { VaultConfigService } from '../../services/VaultConfigService';
import { VaultConfig } from '../../types/VaultConfig';

@injectable()
export class SettingsRouter extends Router {
	public constructor(
		@inject('config') private readonly config: VaultConfig,
		@inject(VaultConfigService) private readonly vaultConfigService: VaultConfigService
	) {
		super();
	}

	@Route.GET('/settings/api-keys')
	public async getApiKeys() {
		return await this.config.civitaiApiKey;
	}

	@Route.PUT('/settings/rename')
	public async renameVault(request: FastifyRequest) {
		const { name } = request.body as { name: string };
		await this.vaultConfigService.setConfigValue('name', name, true);
	}
}
