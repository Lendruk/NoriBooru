import { FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { z } from 'zod';
import { Route, Router } from '../../../lib/Router';
import { uuidSchema } from '../../../schemas/paramIdSchema';
import { CurrencyService } from '../../../services/worldbuilding/CurrencyService';

@injectable()
export class CurrencyRouter extends Router {
	public constructor(@inject(CurrencyService) private readonly currencyService: CurrencyService) {
		super();
	}

	@Route.GET('/world-building/currencies')
	public async getCurrencies() {
		return await this.currencyService.getCurrencies();
	}

	@Route.POST('/world-building/currencies')
	public async createCurrency(request: FastifyRequest) {
		const currencyCreationSchema = z.object({
			name: z.string(),
			weight: z.number(),
			description: z.string()
		});

		const validatedBody = currencyCreationSchema.parse(request.body);

		return await this.currencyService.createCurrency(
			validatedBody.name,
			validatedBody.weight,
			validatedBody.description
		);
	}

	@Route.DELETE('/world-building/currencies/:id')
	public async deleteCurrency(request: FastifyRequest) {
		const { id } = uuidSchema.parse(request.params);
		return await this.currencyService.deleteCurrency(id);
	}

	@Route.PUT('/world-building/currencies/:id')
	public async updateCurrency(request: FastifyRequest) {
		const { id } = uuidSchema.parse(request.params);
		const currencyUpdateSchema = z.object({
			name: z.string(),
			weight: z.number(),
			description: z.string()
		});

		const validatedBody = currencyUpdateSchema.parse(request.body);

		return await this.currencyService.updateCurrency(
			id,
			validatedBody.name,
			validatedBody.weight,
			validatedBody.description
		);
	}
}
