<script lang="ts">
	import NumberInput from './NumberInput.svelte';
	import Select from './Select.svelte';

	type TimeScale = 'seconds' | 'minutes' | 'hours' | 'days';
	// let timeScale = $state<TimeScale>('seconds');
	let {
		value = $bindable<number>(),
		timeScale = 'seconds'
	}: { value: number; timeScale: TimeScale } = $props();

	function convertToScaled(): number {
		if (timeScale === 'seconds') {
			return value / 1000;
		} else if (timeScale === 'minutes') {
			return value / 1000 / 60;
		} else if (timeScale === 'hours') {
			return value / 1000 / 60 / 60;
		} else if (timeScale === 'days') {
			return value / 1000 / 60 / 60 / 24;
		}
		return 0;
	}
	let scaledValue: number = $state(convertToScaled());

	$effect(() => {
		if (timeScale === 'seconds') {
			value = scaledValue * 1000;
		} else if (timeScale === 'minutes') {
			value = scaledValue * 1000 * 60;
		} else if (timeScale === 'hours') {
			value = scaledValue * 1000 * 60 * 60;
		} else if (timeScale === 'days') {
			value = scaledValue * 1000 * 60 * 60 * 24;
		}
	});
</script>

<div class="flex items-center gap-2">
	<NumberInput bind:value={scaledValue} min={1} />
	<Select bind:value={timeScale as TimeScale}>
		<option value="seconds">Seconds</option>
		<option value="minutes">Minutes</option>
		<option value="hours">Hours</option>
		<option value="days">Days</option>
	</Select>
</div>
