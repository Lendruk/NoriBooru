import { FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { z } from 'zod';
import { Route, Router } from '../../../../lib/Router';
import { uuidSchema } from '../../../../schemas/paramIdSchema';
import { SpecieService } from '../../../../services/worldbuilding/SpecieService';

@injectable()
export class SpecieRouter extends Router {
	public constructor(@inject(SpecieService) private specieService: SpecieService) {
		super();
	}

	@Route.GET('/world-building/species')
	public async getSpecies() {
		return await this.specieService.getSpecie();
	}

	@Route.POST('/world-building/species')
	public async createSpecie(request: FastifyRequest) {
		const specieCreationSchema = z.object({
			name: z.string(),
			description: z.string()
		});

		const validatedBody = specieCreationSchema.parse(request.body);

		return await this.specieService.createSpecie(validatedBody.name, validatedBody.description);
	}

	@Route.DELETE('/world-building/species/:id')
	public async deleteSpecie(request: FastifyRequest) {
		const { id } = uuidSchema.parse(request.params);
		return await this.specieService.deleteSpecie(id);
	}

	@Route.PUT('/world-building/species/:id')
	public async updateSpecie(request: FastifyRequest) {
		const { id } = uuidSchema.parse(request.params);
		const specieUpdateSchema = z.object({
			name: z.string(),
			description: z.string()
		});

		const validatedBody = specieUpdateSchema.parse(request.body);

		return await this.specieService.updateSpecie(id, validatedBody.name, validatedBody.description);
	}
}
