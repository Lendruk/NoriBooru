<script lang="ts">
	export let checked: boolean;
	export let inlineLabel: string | undefined;
</script>

<button
	on:click={() => (checked = !checked)}
	class="flex items-center rounded-md gap-4 h-[40px] pl-4 pr-4 bg-red-950 hover:bg-red-900 hover:transition-all"
>
	{#if inlineLabel}
		<div>{inlineLabel}</div>
	{/if}
	<input type="checkbox" bind:checked />
</button>
