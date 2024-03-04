<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import Tooltip from './Tooltip.svelte';

	type Col = {
		key: string;
		display: string | ConstructorOfATypedSvelteComponent;
		spacing?: string;
	};

	type Row = {
		[index: string]: unknown;
    id?: string | number;
	};

	type Action = {
		icon: ConstructorOfATypedSvelteComponent;
		onClick: (id?: string | number) => void | Promise<void>;
		name: string;
	};

	export let rows: Row[] = [];
	export let cols: Col[] = [];
	export let actions: Action[] = [];

	let showToolTip = false;
	let toolTipX = 0;
	let toolTipY = 0;
	let toolTipContent = '';

	function onMouseEnterAction(
		e: MouseEvent & { currentTarget: EventTarget & HTMLSpanElement },
		actionName: string
	) {
		toolTipContent = actionName;
		showToolTip = true;
		toolTipX = e.currentTarget.offsetLeft;
		toolTipY = e.currentTarget.offsetTop;
	}
</script>

<table class="flex flex-col relative box-border">
	<Tooltip x={toolTipX} y={toolTipY} content={toolTipContent} visible={showToolTip} />
	<thead class="flex flex-1 bg-red-950 p-2 rounded-t-md">
		<tr class="flex flex-1 justify-between">
			{#each cols as col, i}
				<th class={`flex flex-1  ${i !== 0 ? 'justify-end' : ''}`}>{col.display}</th>
			{/each}
			{#if actions.length > 0}
				<th class="flex flex-1" />
				<th class="flex flex-1 justify-end">Actions</th>
			{/if}
		</tr>
	</thead>
	<tbody class="flex flex-col box-border">
		{#each rows as row}
			<tr class="flex flex-1 pt-5 pb-5 justify-between pl-2 pr-2 odd:bg-surface-color box-border hover:bg-zinc-700 hover:transition hover:duration-300">
				{#each cols as col, i}
					<td class={`flex flex-1 ${i !== 0 ? 'justify-end' : ''}`}>{row[col.key]}</td>
				{/each}
				{#if actions.length > 0}
					<td class="flex flex-1" />
					<td class="flex flex-1 justify-end gap-4 items-center">
						{#each actions as action}
							<button
								on:mouseleave={() => {
									showToolTip = false;
								}}
								on:mouseenter={(e) => onMouseEnterAction(e, action.name)}
								class="hover:fill-red-900 hover:cursor-pointer hover:transition fill-white"
								on:click={() => action.onClick(row.id)}><svelte:component this={action.icon} /></button
							>
						{/each}
					</td>
				{/if}
			</tr>
		{/each}
	</tbody>
</table>
