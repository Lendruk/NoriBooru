<script lang="ts">
	import LabeledComponent from './LabeledComponent.svelte';
	export let label: string | undefined = undefined;
	export let placeholder: string | undefined = undefined;
	export let value: number;

	export let min: number | undefined = undefined;
	export let max: number | undefined = undefined;
	export let step: number | undefined = undefined;
</script>

{#if label}
	<LabeledComponent>
		<div slot="label">{label}</div>
		<div slot="content" class="flex gap-2">
			<input
				class="h-[40px] flex focus:outline-none w-full bg-surface-color border-red-950 border-2 rounded-md inset-2 shadow-xl pl-2"
				type="number"
				placeholder={placeholder ?? ''}
				{min}
				{max}
				{step}
				pattern="\d*"
				bind:value
			/><slot name="extra" />
		</div>
	</LabeledComponent>
{:else}
	<div class="flex gap-2">
		<input
			class="h-[40px] flex focus:outline-none w-full bg-surface-color border-red-950 border-2 rounded-md inset-2 shadow-xl pl-2"
			type="number"
			placeholder={placeholder ?? ''}
			{min}
			{max}
			{step}
			pattern="\d*"
			bind:value
		/><slot name="extra" />
	</div>
{/if}
