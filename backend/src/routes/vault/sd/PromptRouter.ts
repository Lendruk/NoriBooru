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
}
