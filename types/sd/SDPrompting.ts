import { PopulatedTag } from "../tags/PopulatedTag";
import { SDLora } from "./SDLora";
import { SDWildcard } from "./SDWildcard";

export type PromptLora = {
  lora: SDLora;
  strength: number;
  activatedWords?: string[];
};

export type PromptText = { text: string };

export type PromptTag = { tag: PopulatedTag };

export type PromptWildcard = { wildcard: SDWildcard };

export type PromptItem = PromptText | PromptTag | PromptLora | PromptWildcard;

export type PromptBody = PromptItem[];
