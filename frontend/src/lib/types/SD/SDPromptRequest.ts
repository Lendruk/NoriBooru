import type { PopulatedTag } from '../PopulatedTag';
import type { SDLora } from './SDLora';
import type { SDWildcard } from './SDWildcard';

export type PromptLora = { lora: SDLora; strength: number; activatedWords?: string[] };

export type PromptText = { text: string };

export type PromptTag = { tag: PopulatedTag };

export type PromptWildcard = { wildcard: SDWildcard };

export type PromptItem = (PromptText | PromptTag | PromptLora | PromptWildcard) & { id: number };

export type PromptBody = PromptItem[];

export type Text2ImgPromptBody = {
	positive_prompt: PromptBody;
	negative_prompt: PromptBody;
	steps: number;
	width: number;
	height: number;
	seed: number;
	scheduler: string;
	cfgScale: number;
	iterations: number;
};
