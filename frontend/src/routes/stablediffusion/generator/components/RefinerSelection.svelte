<script lang="ts">
	import Select from '$lib/components/Select.svelte';
	import type { SDCheckpoint } from '$lib/types/SD/SDCheckpoint';
	import SliderInput from '../../../components/SliderInput.svelte';

	export let currentCheckpoint: string;
	export let currentRefinerCheckpoint: string;
	export let refinerSwitchAt: number;
	export let checkpoints: SDCheckpoint[];
	export let isRefinerEnabled: boolean;
</script>

<div>
	<div class="flex gap-4 text-xl items-center">
		<input type="checkbox" bind:checked={isRefinerEnabled} />
		<div>Refiner Checkpoint</div>
	</div>

	<Select class={'h-[40px]'} bind:value={currentRefinerCheckpoint}>
		{#each checkpoints.filter((check) => check.name !== currentCheckpoint) as checkpoint}
			<option value={checkpoint.name}>{checkpoint.name}</option>
		{/each}
	</Select>

	<SliderInput
		bind:value={refinerSwitchAt}
		min={0}
		max={1}
		step={0.1}
		hasNumericInput={true}
		label="Switch at"
	/>
</div>
