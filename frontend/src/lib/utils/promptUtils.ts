import type { SDWildcard } from "$lib/types/SD/SDWildcard";
import { randomInt } from "./random";

export const processPrompt = (wildcards: SDWildcard[], prompt: string): string => {
  let match = prompt.match(/\[wildcard:\w+\]/g);
  while (match) {
    const wildcardName = match[0].split(':')[1].replace(']', '');
    const wildcard = wildcards.find(wild => wild.name.toLowerCase() === wildcardName.toLowerCase());
    if (wildcard) {
      const value = wildcard.values[randomInt(0, wildcard.values.length - 1)]
      prompt = prompt.replace(match[0], value);
    } else {
      prompt = prompt.replace(match[0], '');
    }
    match = prompt.match(/\[wildcard:\w+\]/g);
  }
  return prompt;
}