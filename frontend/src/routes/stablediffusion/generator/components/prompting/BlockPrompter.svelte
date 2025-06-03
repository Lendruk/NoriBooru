<script lang="ts">
	import type { PopulatedTag } from '$lib/types/PopulatedTag';
	import type { SDLora } from '$lib/types/SD/SDLora';
	import type { PromptBody } from '$lib/types/SD/SDPromptRequest';
	import type { SDWildcard } from '$lib/types/SD/SDWildcard';
	import { dndzone } from 'svelte-dnd-action';
	import BlockPromptLoraItem from './prompt-items/BlockPromptLoraItem.svelte';
	import BlockPromptTagItem from './prompt-items/BlockPromptTagItem.svelte';
	import BlockPromptTextItem from './prompt-items/BlockPromptTextItem.svelte';
	import BlockPromptWildcardItem from './prompt-items/BlockPromptWildcardItem.svelte';

	type ActionListItem = {
		text: string;
		action: () => void;
	};

	let {
		tags,
		loras,
		wildcards,
		currentPrompt = $bindable()
	}: {
		tags: PopulatedTag[];
		loras: SDLora[];
		currentPrompt: PromptBody;
		wildcards: SDWildcard[];
	} = $props();
	let promptInputValue = $state<string>('');

	// Action list items
	let showingActionList = $state<boolean>(false);
	let actionListFocused = $state<boolean>(false);
	let highLightedActionListEntry = $state(0);
	let actionListItems = $state<ActionListItem[]>([]);

	function addTextElementToPrompt() {
		console.log('Adding text element to prompt');
		if (promptInputValue) {
			let curLength = currentPrompt.length;
			currentPrompt.push({ text: promptInputValue, id: curLength });
			promptInputValue = '';
			showingActionList = false;
			highLightedActionListEntry = 0;
		}
	}

	function addTagElementToPrompt(tag: PopulatedTag) {
		console.log('Adding tag element to prompt');
		let curLength = currentPrompt.length;
		currentPrompt.push({ tag, id: curLength });
		promptInputValue = '';
		showingActionList = false;
		highLightedActionListEntry = 0;
	}

	function addLoraElementToPrompt(lora: SDLora) {
		console.log('Adding lora element to prompt');
		currentPrompt.push({ lora, strength: 0.5, id: currentPrompt.length });
		promptInputValue = '';
		showingActionList = false;
		highLightedActionListEntry = 0;
	}

	function addWildcardElementToPrompt(wildcard: SDWildcard) {
		currentPrompt.push({
			wildcard,
			id: currentPrompt.length
		});
	}

	function removeItem(index: number) {
		currentPrompt.splice(index, 1);
		// Update the IDs of the remaining items
		currentPrompt.forEach((item, idx) => {
			item.id = idx;
		});
	}

	$effect(() => {
		if (!showingActionList) {
			actionListItems = [];
			highLightedActionListEntry = 0;
		}
	});

	function buildActionList() {
		actionListItems = [];
		// Search tags
		const matchingTags = tags.filter((tag) =>
			tag.name.toLowerCase().includes(promptInputValue.toLowerCase())
		);

		// Search loras
		const matchingLoras = loras.filter((lora) =>
			lora.name.toLowerCase().includes(promptInputValue.toLowerCase())
		);

		// Search wildcards
		const matchingWildcards = wildcards.filter((wildcard) =>
			wildcard.name.toLowerCase().includes(promptInputValue.toLowerCase())
		);

		let count = 0;
		for (const matchingTag of matchingTags) {
			actionListItems.push({
				text: `Add tag ${matchingTag.name}`,
				action: () => addTagElementToPrompt(matchingTag)
			});
		}

		for (const matchingLora of matchingLoras) {
			actionListItems.push({
				text: `Add lora ${matchingLora.name}`,
				action: () => addLoraElementToPrompt(matchingLora)
			});
		}

		for (const matchingWildcard of matchingWildcards) {
			actionListItems.push({
				text: `Add wildcard ${matchingWildcard.name}`,
				action: () => addWildcardElementToPrompt(matchingWildcard)
			});
		}

		actionListItems.push({
			text: `Add text element`,
			action: addTextElementToPrompt
		});
	}
</script>

<div class="flex flex-col flex-1 bg-surface-color rounded-md border-red-950 flex-wrap min-h-[40px]">
	<div
		class="flex flex-row flex-wrap"
		use:dndzone={{
			items: currentPrompt,
			flipDurationMs: 200
		}}
		onconsider={(e) => (currentPrompt = e.detail.items)}
		onfinalize={(e) => (currentPrompt = e.detail.items)}
	>
		{#each currentPrompt as promptItem, index (promptItem.id)}
			<div class="p-2" data-id={promptItem.id}>
				{#if 'text' in promptItem}
					<BlockPromptTextItem
						bind:text={promptItem.text}
						onDelete={() => {
							removeItem(index);
						}}
					/>
				{:else if 'tag' in promptItem}
					<BlockPromptTagItem
						tag={promptItem.tag}
						onDelete={() => {
							removeItem(index);
						}}
					/>
				{:else if 'lora' in promptItem}
					<BlockPromptLoraItem
						promptLora={promptItem}
						onDelete={() => {
							removeItem(index);
						}}
					/>
				{:else if 'wildcard' in promptItem}
					<BlockPromptWildcardItem
						promptWildcard={promptItem}
						onDelete={() => {
							removeItem(index);
						}}
					/>
				{:else}
					<span>unsupported</span>
				{/if}
			</div>
		{/each}
	</div>
	<div class="relative">
		<input
			type="text"
			class="bg-transparent border-none outline-none flex-1 pl-1"
			placeholder="Add new prompt item..."
			bind:value={promptInputValue}
			onfocusout={() => {
				if (!actionListFocused) {
					showingActionList = false;
				}
			}}
			onkeydown={(e) => {
				if (showingActionList) {
					if (e.code === 'Escape') {
						showingActionList = false;
					} else if (e.code === 'ArrowUp') {
						highLightedActionListEntry--;

						if (highLightedActionListEntry < 0) {
							highLightedActionListEntry = actionListItems.length - 1;
						}
					} else if (e.code === 'ArrowDown') {
						highLightedActionListEntry++;

						if (highLightedActionListEntry === actionListItems.length) {
							highLightedActionListEntry = 0;
						}
					} else if (e.code === 'Enter') {
						actionListItems[highLightedActionListEntry].action();
						showingActionList = false;
					} else {
						buildActionList();
					}
				} else {
					if (promptInputValue === '') {
						return;
					}
					if (!e.ctrlKey && e.code === 'Enter') {
						const exactTag = tags.find(
							(tag) => tag.name.toLowerCase() === promptInputValue.toLowerCase()
						);
						if (exactTag) {
							addTagElementToPrompt(exactTag);
						} else {
							addTextElementToPrompt();
						}
					}
					if (e.ctrlKey && e.code === 'Space') {
						showingActionList = !showingActionList;
						buildActionList();
					}
				}
			}}
		/>
		<div
			class={`${showingActionList ? 'absolute' : 'hidden'} bg-surface-color flex items-start text-left flex-col border-red-950`}
			role="menu"
			tabindex="0"
			onmouseleave={() => {
				actionListFocused = false;
			}}
			onmouseenter={() => {
				actionListFocused = true;
			}}
			onfocusout={() => {
				actionListFocused = false;
				showingActionList = false;
			}}
		>
			{#each actionListItems as item, index (index)}
				<button
					onclick={item.action}
					class={`${highLightedActionListEntry === index ? 'bg-red-950' : ''} pr-2 pl-2 pt-1 pb-1 w-full text-left`}
				>
					{item.text}
				</button>
			{/each}
		</div>
	</div>
</div>
