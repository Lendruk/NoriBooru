import { FastifyRequest } from 'fastify';
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

	@Route.POST('/sd/wildcards')
	public async createWildcard(request: FastifyRequest) {
		const body = request.body as { name: string; values: string[] };
		return await this.wildcardService.createWildcard(body.name, body.values);
	}

	@Route.DELETE('/sd/wildcards/:id')
	public async deleteWildcard(request: FastifyRequest) {
		const { id } = request.params as { id: string };
		await this.wildcardService.deleteWildcard(id);
	}
}
