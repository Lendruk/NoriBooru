<script lang="ts">
	import ChevronDown from './icons/ChevronDown.svelte';
	import ChevronUp from './icons/ChevronUp.svelte';

	export let header = '';
	export let open = false;
</script>

<div>
	<div
		class="flex flex-row items-center bg-zinc-900 pt-4 pb-5 pl-4 rounded-md m-2 hover:cursor-pointer"
		on:click={() => (open = !open)}
	>
		{#if open}
			<ChevronUp class="fill-white" />
		{:else}
			<ChevronDown class="fill-white" />
		{/if}
		<span class="ml-2">{header}</span>
	</div>
	<div class={`${open ? 'block' : 'hidden'} p-4 rounded-md pt-4 mr-4 mb-5 ml-4 bg-zinc-900`}>
		<slot />
	</div>
</div>
