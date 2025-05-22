import { FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { z } from 'zod';
import { Route, Router } from '../../../lib/Router';
import { uuidSchema } from '../../../schemas/paramIdSchema';
import { CultureService } from '../../../services/worldbuilding/CultureService';

@injectable()
export class CultureRouter extends Router {
	public constructor(@inject(CultureService) private readonly cultureService: CultureService) {
		super();
	}

	@Route.GET('/world-building/cultures')
	public async getCultures() {
		return await this.cultureService.getCultures();
	}

	@Route.POST('/world-building/cultures')
	public async createCulture(request: FastifyRequest) {
		const cultureCreationSchema = z.object({
			name: z.string(),
			description: z.string()
		});

		const validatedBody = cultureCreationSchema.parse(request.body);

		return await this.cultureService.createCulture(validatedBody.name, validatedBody.description);
	}

	@Route.DELETE('/world-building/cultures/:id')
	public async deleteCulture(request: FastifyRequest) {
		const { id } = uuidSchema.parse(request.params);
		return await this.cultureService.deleteCulture(id);
	}

	@Route.PUT('/world-building/cultures/:id')
	public async updateCulture(request: FastifyRequest) {
		const { id } = uuidSchema.parse(request.params);
		const cultureUpdateSchema = z.object({
			name: z.string(),
			description: z.string()
		});

		const validatedBody = cultureUpdateSchema.parse(request.body);

		return await this.cultureService.updateCulture(
			id,
			validatedBody.name,
			validatedBody.description
		);
	}
}
