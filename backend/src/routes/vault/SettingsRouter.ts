import { inject, injectable } from 'inversify';
import { Route, Router } from '../../lib/Router';
import { VaultConfig } from '../../types/VaultConfig';

@injectable()
export class SettingsRouter extends Router {
	public constructor(@inject('config') private config: VaultConfig) {
		super();
	}

	@Route.GET('/settings/api-keys')
	public async getApiKeys() {
		return await this.config.civitaiApiKey;
	}
}
