<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let value: string;
	export let placeholder: string | undefined = undefined;
	export let disabled: boolean = false;

	const dispatch = createEventDispatcher();
</script>

<input
	class={`h-[40px] flex focus:outline-none w-full bg-surface-color border-red-950 border-2 rounded-md inset-2 shadow-xl pl-2 ${disabled ? 'text-gray-500 cursor-not-allowed' : ''}`}
	type="text"
	{disabled}
	placeholder={placeholder ?? ''}
	bind:value
	on:input={(e) => dispatch('input', e)}
/>
