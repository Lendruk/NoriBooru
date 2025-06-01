import { PromptBody } from "./SDPrompting";

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
