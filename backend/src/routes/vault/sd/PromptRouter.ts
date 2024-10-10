import { FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { Route, Router } from '../../../lib/Router';
import { PromptService } from '../../../services/SD/PromptService';

@injectable()
export class PromptRouter extends Router {
	public constructor(@inject(PromptService) private readonly promptService: PromptService) {
		super();
	}

	@Route.GET('/sd/prompts')
	public async getPrompts() {
		return await this.promptService.getPrompts();
	}

	@Route.DELETE('/sd/prompts/:id')
	public async deletePrompt(request: FastifyRequest) {
		const { id } = request.params as { id: string };
		await this.promptService.deletePrompt(id);
	}
}
