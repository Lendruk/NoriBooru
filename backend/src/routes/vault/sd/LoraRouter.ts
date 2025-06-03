import { FastifyReply, FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { Route, Router } from '../../../lib/Router';
import { SDLoraService, UpdateLoraOptions } from '../../../services/SD/SDLoraService';
import { SDService } from '../../../services/SD/SDService';

@injectable()
export class LoraRouter extends Router {
	public constructor(
		@inject(SDLoraService) private readonly loraService: SDLoraService,
		@inject(SDService) private readonly sdService: SDService
	) {
		super();
	}

	@Route.GET('/sd/loras')
	public async getLoras(request: FastifyRequest, reply: FastifyReply) {
		const { name, tags } = request.query as { name: string; tags?: string };

		let tagArr: number[] = [];
		if (tags) {
			tagArr = tags.split(',').map((id) => Number.parseInt(id));
		}

		const loras = await this.loraService.getLoras(tagArr, name);
		return reply.send(loras);
	}

	@Route.POST('/sd/refresh-loras')
	public async refreshLoras(_: FastifyRequest, reply: FastifyReply) {
		// await this.sdService.refreshLoras();
		return reply.send({ message: 'Loras refreshed successfully' });
	}

	@Route.PUT('/sd/loras/:id')
	public async updateLora(request: FastifyRequest) {
		const { id } = request.params as { id: string };
		const body = request.body as UpdateLoraOptions;
		const lora = await this.loraService.updateLora(id, body);
		return lora;
	}

	@Route.DELETE('/sd/loras/:id')
	public async deleteLora(request: FastifyRequest, reply: FastifyReply) {
		const { id } = request.params as { id: string };
		await this.loraService.deleteLora(id);
		return reply.status(204).send({ message: 'Lora deleted successfully' });
	}
}
