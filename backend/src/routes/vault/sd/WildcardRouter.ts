import { inject, injectable } from 'inversify';
import { Route, Router } from '../../../lib/Router';
import { WildcardService } from '../../../services/SD/WildcardService';

@injectable()
export class WildcardRouter extends Router {
	public constructor(@inject(WildcardService) private readonly wildcardService: WildcardService) {
		super();
	}

	@Route.GET('/sd/wildcards')
	public async getWildcards() {
		return await this.wildcardService.getWildcards();
	}
}
