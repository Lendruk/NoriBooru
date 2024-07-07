<script lang="ts">
	import LabeledComponent from './LabeledComponent.svelte';
	export let label: string;
	export let hasNumericInput: boolean = false;
	export let hasValueInLabel: boolean = false;
	export let value: number;
	export let min: number | undefined = undefined;
	export let max: number | undefined = undefined;
	export let step: number | undefined = undefined;
</script>

<LabeledComponent>
	<div slot="label" class="flex justify-between">
		<div>
			{label}
			{#if hasValueInLabel}({value}){/if}
		</div>
		{#if hasNumericInput}
			<input
				type="numeric"
				{min}
				{max}
				{step}
				bind:value
				class="focus:outline-none rounded-md w-2/12 bg-surface-color border-red-950 border-2 text-right pr-2"
			/>
		{/if}
	</div>
	<div slot="content" class="w-full">
		<input class="w-full" type="range" bind:value {min} {max} {step} />
	</div>
</LabeledComponent>

<style>
</style>
