<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Button from './Button.svelte';

	export let value: string;
	export let placeholder: string | undefined = undefined;
	export let disabled: boolean = false;
	export let isBlurred = false;

	const dispatch = createEventDispatcher();
</script>

<input
	class={`h-[40px] flex focus:outline-none w-full bg-surface-color border-red-950 border-2 rounded-md inset-2 shadow-xl pl-2 ${disabled ? 'text-gray-500 cursor-not-allowed' : ''} ${isBlurred ? 'blur-lg' : ''}`}
	type="text"
	{disabled}
	placeholder={placeholder ?? ''}
	bind:value
	on:input={(e) => dispatch('input', e)}
/>
{#if isBlurred}
	<Button onClick={() => (isBlurred = false)}>Show</Button>
{/if}
