<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import LoadingSpinner from '../../routes/components/LoadingSpinner.svelte';
	export { cssClass as class };
	let cssClass = '';

	export let value: string = '';
	export let isLoading: boolean = false;

	const dispatch = createEventDispatcher();
</script>

<div class="relative">
	<select
		on:change={(e) => dispatch('change', e)}
		bind:value
		class={` bg-surface-color border-red-950 border-2 rounded-md shadow-xl pl-2 cursor-pointer ${cssClass}`}
	>
		<slot />
	</select>
	{#if isLoading}
		<div
			class="absolute w-full backdrop-blur-md h-full top-0 rounded-sm flex justify-between items-center p-2"
		>
			<div>Loading</div>
			<LoadingSpinner width={25} height={25} />
		</div>
	{/if}
</div>
