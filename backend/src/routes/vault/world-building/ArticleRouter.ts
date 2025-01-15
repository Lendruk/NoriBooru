import { FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { z } from 'zod';
import { Route, Router } from '../../../lib/Router';
import { uuidSchema } from '../../../schemas/paramIdSchema';
import { ArticleService } from '../../../services/worldbuilding/ArticleService';

@injectable()
export class ArticleRouter extends Router {
	public constructor(@inject(ArticleService) private readonly articleService: ArticleService) {
		super();
	}

	@Route.GET('/world-building/articles')
	public async getArticles() {
		return await this.articleService.getArticles();
	}

	@Route.GET('/world-building/articles/:id')
	public async getArticle(request: FastifyRequest) {
		const { id } = uuidSchema.parse(request.params);
		return await this.articleService.getArticle(id);
	}

	@Route.POST('/world-building/articles')
	public async createArticle(request: FastifyRequest) {
		const articleCreationSchema = z.object({
			content: z.string(),
			tags: z.array(z.number())
		});

		const validatedBody = articleCreationSchema.parse(request.body);

		return await this.articleService.createArticle(validatedBody.content, validatedBody.tags);
	}

	@Route.PUT('/world-building/articles/:id')
	public async updateArticle(request: FastifyRequest) {
		const { id } = uuidSchema.parse(request.params);
		const articleUpdateSchema = z.object({
			content: z.string(),
			tags: z.array(z.number())
		});

		const validatedBody = articleUpdateSchema.parse(request.body);

		return await this.articleService.updateArticle(id, validatedBody.content, validatedBody.tags);
	}

	@Route.DELETE('/world-building/articles/:id')
	public async deleteArticle(request: FastifyRequest) {
		const { id } = uuidSchema.parse(request.params);
		return await this.articleService.deleteArticle(id);
	}
}
