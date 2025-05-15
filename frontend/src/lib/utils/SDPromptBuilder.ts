import type { PromptBody, Text2ImgPromptBody } from '$lib/types/SD/SDPromptRequest';

export class SDPromptBuilder {
	private promptRequest: Text2ImgPromptBody;

	public constructor() {
		this.promptRequest = {
			positive_prompt: [],
			negative_prompt: [],
			steps: 20,
			width: 512,
			height: 512,
			seed: -1,
			scheduler: ''
		};
	}

	public withPositivePrompt(prompt: PromptBody): this {
		this.promptRequest.positive_prompt = prompt;
		return this;
	}

	public withScheduler(scheduler: string): this {
		this.promptRequest.scheduler = scheduler;
		return this;
	}

	public withNegativePrompt(prompt: PromptBody): this {
		this.promptRequest.negative_prompt = prompt;
		return this;
	}

	public withSteps(steps: number): this {
		this.promptRequest.steps = steps;
		return this;
	}

	public withSize(width: number, height: number): this {
		this.promptRequest.width = width;
		this.promptRequest.height = height;
		return this;
	}

	public withSeed(seed: number): this {
		this.promptRequest.seed = seed;
		return this;
	}

	public build(): Text2ImgPromptBody {
		return this.promptRequest;
	}
}
