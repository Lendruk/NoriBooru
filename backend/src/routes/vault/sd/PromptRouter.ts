import { FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { Route, Router } from '../../../lib/Router';
import { CreatePromptOptions, PromptService } from '../../../services/SD/PromptService';

@injectable()
export class PromptRouter extends Router {
	public constructor(@inject(PromptService) private readonly promptService: PromptService) {
		super();
	}

	@Route.GET('/sd/prompts')
	public async getPrompts() {
		return await this.promptService.getPrompts();
	}

	@Route.POST('/sd/prompts')
	public async createPrompt(request: FastifyRequest) {
		const body = request.body as CreatePromptOptions;
		return await this.promptService.createPrompt(body);
	}

	@Route.GET('/sd/prompts/:id')
	public async getPrompt(request: FastifyRequest) {
		const { id } = request.params as { id: string };
		return await this.promptService.getPrompt(id);
	}

	@Route.PUT('/sd/prompts/:id')
	public async updatePrompt(request: FastifyRequest) {
		const { id } = request.params as { id: string };
		const body = request.body as CreatePromptOptions;
		return await this.promptService.updatePrompt(id, body);
	}

	@Route.DELETE('/sd/prompts/:id')
	public async deletePrompt(request: FastifyRequest) {
		const { id } = request.params as { id: string };
		await this.promptService.deletePrompt(id);
		return {};
	}
}
