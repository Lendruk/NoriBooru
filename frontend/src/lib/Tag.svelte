<script lang="ts">
	import type { MouseEventHandler } from 'svelte/elements';
	import ArrowRight from './icons/ArrowRight.svelte';
	import EditIcon from './icons/editIcon.svelte';
	import type { PopulatedTag } from './types/PopulatedTag';

	export let tag: PopulatedTag;
	export let onDelete: MouseEventHandler<HTMLButtonElement> | undefined = undefined;
	export let onEdit: MouseEventHandler<HTMLButtonElement> | undefined = undefined;
	export let onClick: MouseEventHandler<HTMLSpanElement> | undefined = undefined;

	let showParent = false;

	function formatTagName(name: string): string {
		return name.replaceAll('_', ' ');
	}

	$: cssVarStyles = `--color: ${tag.color}; cursor: ${onClick ? 'pointer' : 'default'}`;
</script>

<span aria-pressed="false" on:click={onClick ?? undefined} style={cssVarStyles} class="tag">
	<slot>
		<button on:click={onEdit} class={`editButton ${!onEdit ? 'invisible' : 'mr-2'}`}
			><EditIcon class="fill-white" /></button
		>
		<span class="flex items-center gap-1">
			{#if tag.parent}
				{#if showParent}
					{formatTagName(tag.parent.name)}
				{/if}
				<button
					on:click={(e) => {
						e.stopPropagation();
						showParent = !showParent;
					}}
					class="hover:fill-red-900 hover:transition fill-white"
				>
					<ArrowRight />
				</button>
			{/if}
			{formatTagName(tag.name)}
			{tag.mediaCount > 0 ? `(${tag.mediaCount})` : ''}
		</span>
		<button class={`delete ${!onDelete && 'invisible'}`} on:click={onDelete}> X </button>
	</slot>
</span>

<style>
	.tag {
		padding: 0.5em 1em;
		background-color: var(--color, #007bff);
		color: white;
		border-radius: 2em;
		text-align: center;
		max-height: 50px;

		display: flex;
		flex-direction: row;
	}

	.editButton {
		background-color: transparent;
		border: none;
		color: white;
		cursor: pointer;
	}

	.tag .delete {
		cursor: pointer;
		margin-left: 0.5em;
		background-color: transparent;
		border: none;
		color: white;
	}
</style>
