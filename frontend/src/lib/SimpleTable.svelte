<script lang="ts">
	import Tooltip from './Tooltip.svelte';
	import ChevronDown from './icons/ChevronDown.svelte';
	import ChevronUp from './icons/ChevronUp.svelte';

	type SimpleCol = {
		key: string;
		formatter?: (val: unknown) => string;
	};

	type Col = { header: string } & (
		| SimpleCol
		| { customRender: ConstructorOfATypedSvelteComponent }
	);

	type Row = {
		[index: string]: unknown;
		id?: string | number;
	};

	type Action = {
		icon: ConstructorOfATypedSvelteComponent;
		onClick: (id?: string | number) => void | Promise<void>;
		condition?: (row: Row) => boolean;
		name: string;
	};

	type OrderableOptions = {
		onMoveUp: (id?: string | number) => void | Promise<void>;
		onMoveDown: (id?: string | number) => void | Promise<void>;
	};

	export let rows: Row[] = [];
	export let cols: Col[] = [];
	export let actions: Action[] = [];
	export let orderable: OrderableOptions | undefined = undefined;

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
		toolTipX = e.currentTarget.offsetLeft - 100;
		toolTipY = e.currentTarget.offsetTop;
	}

	function formatActionAvailability(row: Row, action: Action) {
		if (action.condition) {
			if (!action.condition(row)) {
				return `fill-zinc-400 hover:cursor-not-allowed`;
			}
		}
		return '';
	}

	function handleActionClick(row: Row, action: Action) {
		if (action.condition && !action.condition(row)) {
			return;
		}
		return action.onClick(row.id);
	}
</script>

<table class="flex flex-col relative box-border">
	<Tooltip
		x={toolTipX}
		y={toolTipY}
		content={toolTipContent}
		visible={showToolTip}
		automaticMode={false}
	/>
	<thead class="flex flex-1 bg-red-950 p-2 rounded-t-md">
		<tr class="flex flex-1 justify-between">
			{#if orderable}
				<th class="flex flex-[0.2]">#</th>
			{/if}
			{#each cols as col, i}
				<th class={`flex flex-1 items-center  ${i !== 0 ? 'justify-end' : ''}`}>{col.header}</th>
			{/each}
			{#if actions.length > 0}
				<th class="flex flex-1" />
				<th class="flex flex-1 justify-end">Actions</th>
			{/if}
		</tr>
	</thead>
	<tbody class="flex flex-col box-border">
		{#if rows.length > 0}
			{#each rows as row, i}
				<tr
					class="flex flex-1 pt-5 pb-5 justify-between pl-2 pr-2 odd:bg-surface-color box-border hover:bg-zinc-700 hover:transition hover:duration-300"
				>
					{#if orderable}
						<td class="flex justify-center flex-col flex-[0.2]">
							{#if i == 0}
								<button on:click={() => orderable?.onMoveDown(row.id)}>
									<ChevronDown
										class="fill-white hover:fill-red-900 hover:cursor-pointer hover:transition"
									/>
								</button>
							{:else if i == rows.length - 1}
								<button on:click={() => orderable?.onMoveUp(row.id)}>
									<ChevronUp
										class="fill-white hover:fill-red-900 hover:cursor-pointer hover:transition"
									/>
								</button>
							{:else}
								<button on:click={() => orderable?.onMoveUp(row.id)}>
									<ChevronUp
										class="fill-white hover:fill-red-900 hover:cursor-pointer hover:transition"
									/>
								</button>
								<button on:click={() => orderable?.onMoveDown(row.id)}>
									<ChevronDown
										class="fill-white hover:fill-red-900 hover:cursor-pointer hover:transition"
									/>
								</button>
							{/if}
						</td>
					{/if}
					{#each cols as col, j}
						<td class={`flex flex-1 items-center ${j !== 0 ? 'justify-end' : ''}`}>
							{#if 'key' in col}
								{#if col.formatter}
									{col.formatter(row[col.key])}
								{:else}
									{row[col.key]}
								{/if}
							{:else}
								<svelte:component this={col.customRender} {row} />
							{/if}
						</td>
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
									class={`hover:fill-red-900 hover:cursor-pointer hover:transition fill-white ${formatActionAvailability(row, action)}`}
									on:click={() => handleActionClick(row, action)}
									><svelte:component this={action.icon} /></button
								>
							{/each}
						</td>
					{/if}
				</tr>
			{/each}
		{:else}
			<tr class="flex bg-surface-color pt-5 pb-5 justify-center flex-1">
				<td class="text-xl">No Items</td>
			</tr>
		{/if}
	</tbody>
</table>
