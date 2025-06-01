<script lang="ts">
	import type { PopulatedTag } from '$lib/types/PopulatedTag';
	import type { SDLora } from '$lib/types/SD/SDLora';
	import {
		type PromptBody,
		type PromptLora,
		type PromptText,
		type PromptWildcard
	} from '$lib/types/SD/SDPromptRequest';
	import type { SDWildcard } from '$lib/types/SD/SDWildcard';
	import { LabeledComponent, TextArea } from '@lendruk/personal-svelte-ui-lib';

	let {
		positivePrompt = $bindable(),
		negativePrompt = $bindable(),
		loras = $bindable(),
		wildcards = $bindable(),
		tags = $bindable()
	}: {
		positivePrompt: PromptBody;
		negativePrompt: PromptBody;
		loras: SDLora[];
		wildcards: SDWildcard[];
		tags: PopulatedTag[];
	} = $props();

	function serializePromptBody(prompt: PromptBody): string {
		return prompt
			.map((item) => {
				if ('text' in item) return item.text;
				if ('tag' in item) return item.tag.name; // or tag.slug, depending on your use
				if ('wildcard' in item) return `__${item.wildcard.name}__`;
				if ('lora' in item) return `<lora:${item.lora.name}:${item.strength}>`;
				return '';
			})
			.join(', ');
	}

	function parseTextToPromptBody(text: string): PromptBody {
		const items = text.split(',').map((raw, index) => {
			const trimmed = raw.trim();
			if (trimmed.startsWith('<lora:')) {
				const [, name, strength] = trimmed.match(/<lora:(.*):([\d.]+)>/) ?? [];
				return {
					id: index,
					lora: loras.find((lr) => lr.name === name)!,
					strength: parseFloat(strength ?? '1')
				} satisfies PromptLora & { id: number };
			}
			if (trimmed.startsWith('__') && trimmed.endsWith('__')) {
				const wildcard = trimmed.slice(2, -2);
				return {
					id: index,
					wildcard: wildcards.find((wc) => wc.name === wildcard)!
				} satisfies PromptWildcard & { id: number };
			}
			// fallback to plain text
			return {
				id: index,
				text: trimmed
			} satisfies PromptText & { id: number };
		});

		return items;
	}

	// --- Bi-directional string binding with derived state ---
	let textualPositivePrompt = $derived(serializePromptBody(positivePrompt));
	let textualNegativePrompt = $derived(serializePromptBody(negativePrompt));

	$effect(() => {
		// You may want a better deep comparison here
		const parsed = parseTextToPromptBody(textualPositivePrompt);
		if (JSON.stringify(parsed) !== JSON.stringify(positivePrompt)) {
			positivePrompt = parsed;
		}
	});

	$effect(() => {
		const parsed = parseTextToPromptBody(textualNegativePrompt);
		if (JSON.stringify(parsed) !== JSON.stringify(negativePrompt)) {
			negativePrompt = parsed;
		}
	});
</script>

<div class="flex flex-col flex-1">
	<LabeledComponent>
		<div slot="label">Prompt</div>
		<TextArea slot="content" bind:value={textualPositivePrompt} />
	</LabeledComponent>
	<LabeledComponent>
		<div slot="label">Negative Prompt</div>
		<TextArea slot="content" bind:value={textualNegativePrompt} />
	</LabeledComponent>
</div>
