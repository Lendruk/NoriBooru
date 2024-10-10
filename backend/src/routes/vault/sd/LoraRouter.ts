import { FastifyReply, FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { Route, Router } from '../../../lib/Router';
import { SDLoraService } from '../../../services/SD/SDLoraService';

@injectable()
export class LoraRouter extends Router {
	public constructor(@inject(SDLoraService) private readonly loraService: SDLoraService) {
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

	@Route.DELETE('/sd/loras/:id')
	public async deleteLora(request: FastifyRequest) {
		const { id } = request.params as { id: string };
		await this.loraService.deleteLora(id);
	}
}
