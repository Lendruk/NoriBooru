import { FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { z } from 'zod';
import { Route, Router } from '../../../lib/Router';
import { uuidSchema } from '../../../schemas/paramIdSchema';
import { ItemService } from '../../../services/worldbuilding/ItemService';

@injectable()
export class WorldItemRouter extends Router {
	public constructor(@inject(ItemService) private readonly itemService: ItemService) {
		super();
	}

	@Route.GET('/world-building/items')
	public async getItems() {
		return await this.itemService.getItems();
	}

	@Route.POST('/world-building/items')
	public async createItem(request: FastifyRequest) {
		const itemCreationSchema = z.object({
			name: z.string(),
			description: z.string(),
			mediaItems: z.array(z.number()),
			values: z.array(
				z.object({
					currencyId: z.string(),
					amount: z.number()
				})
			)
		});

		const validatedBody = itemCreationSchema.parse(request.body);

		return await this.itemService.createItem(
			validatedBody.name,
			validatedBody.description,
			validatedBody.mediaItems,
			validatedBody.values
		);
	}

	@Route.PUT('/world-building/items/:id')
	public async updateItem(request: FastifyRequest) {
		const { id } = uuidSchema.parse(request.params);
		const itemUpdateSchema = z.object({
			name: z.string(),
			description: z.string(),
			mediaItems: z.array(z.number()),
			values: z.array(
				z.object({
					currencyId: z.string(),
					amount: z.number()
				})
			)
		});

		const validatedBody = itemUpdateSchema.parse(request.body);

		return await this.itemService.updateItem(
			id,
			validatedBody.name,
			validatedBody.description,
			validatedBody.mediaItems,
			validatedBody.values
		);
	}

	@Route.DELETE('/world-building/items/:id')
	public async deleteItem(request: FastifyRequest) {
		const { id } = uuidSchema.parse(request.params);
		return await this.itemService.deleteItem(id);
	}
}
