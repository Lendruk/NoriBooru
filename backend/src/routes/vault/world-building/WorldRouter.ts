import { FastifyReply, FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { z } from 'zod';
import { Route, Router } from '../../../lib/Router';
import { WorldService } from '../../../services/worldbuilding/WorldService';

@injectable()
export class WorldRouter extends Router {
	public constructor(@inject(WorldService) private readonly worldService: WorldService) {
		super();
	}

	@Route.GET('/world-building/world')
	public async getWorld(request: FastifyRequest, reply: FastifyReply) {
		try {
			return await this.worldService.getWorld();
		} catch {
			return reply.status(404).send();
		}
	}

	@Route.POST('/world-building/world')
	public async createWorld(request: FastifyRequest) {
		const worldCreationSchema = z.object({
			name: z.string(),
			description: z.string()
		});

		const validatedBody = worldCreationSchema.parse(request.body);

		return await this.worldService.createWorld(validatedBody.name, validatedBody.description);
	}

	@Route.PUT('/world-building/world')
	public async updateWorld(request: FastifyRequest) {
		const worldUpdateSchema = z.object({
			name: z.string(),
			description: z.string()
		});

		const validatedBody = worldUpdateSchema.parse(request.body);

		return await this.worldService.updateWorld(validatedBody.name, validatedBody.description);
	}
}
