import { FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { Route, Router } from '../../lib/Router';
import { TagService } from '../../services/TagService';

@injectable()
export class TagRouter extends Router {
	public constructor(@inject(TagService) private tagService: TagService) {
		super();
	}

	@Route.GET('/tags')
	public async getTags(request: FastifyRequest) {
		let nameToQuery: string | undefined = undefined;

		if (request.query) {
			const { name } = request.query as { name: string };
			nameToQuery = name;
		}

		return await this.tagService.getAllTags(nameToQuery);
	}

	@Route.DELETE('/tags/:id')
	public async deleteTag(request: FastifyRequest) {
		const { id } = request.params as { id: number };
		await this.tagService.deleteTag(id);
	}
}
