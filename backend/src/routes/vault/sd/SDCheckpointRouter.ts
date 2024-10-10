import { FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { Route, Router } from '../../../lib/Router';
import { SDCheckpointService } from '../../../services/SD/SDCheckpointService';

@injectable()
export class SDCheckpointRouter extends Router {
	public constructor(
		@inject(SDCheckpointService) private readonly sdCheckpointService: SDCheckpointService
	) {
		super();
	}

	@Route.GET('/sd/checkpoints')
	public async getSDCheckpoints(request: FastifyRequest) {
		const { name } = request.query as { name: string };
		return await this.sdCheckpointService.getSDCheckpoints(name);
	}

	@Route.DELETE('/sd/checkpoints/:id')
	public async deleteCheckpoint(request: FastifyRequest) {
		const { id } = request.params as { id: string };
		await this.sdCheckpointService.deleteCheckpoint(id);
	}
}
