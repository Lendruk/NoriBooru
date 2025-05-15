import { FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { Route, Router } from '../../lib/Router';
import { VaultConfigService } from '../../services/VaultConfigService';

@injectable()
export class SettingsRouter extends Router {
	public constructor(
		@inject(VaultConfigService) private readonly vaultConfigService: VaultConfigService
	) {
		super();
	}

	@Route.GET('/settings/api-keys')
	public async getApiKeys() {
		return {
			civitai: await this.vaultConfigService.getConfigValue('civitaiApiKey')
		};
	}

	@Route.GET('/settings/version')
	public async getVersion() {
		return {
			version: this.vaultConfigService.getConfigValue('version')
		};
	}

	@Route.PUT('/settings/rename')
	public async renameVault(request: FastifyRequest) {
		const { name } = request.body as { name: string };
		await this.vaultConfigService.setConfigValue('name', name, true);
	}
}
