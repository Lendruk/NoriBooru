<script lang="ts">
	import JobViewerIcon from '$lib/icons/JobViewerIcon.svelte';
	import { runningJobs } from '../../../store';

	let amtOfRunningJobs = $state(0);
	$effect(() => {
		amtOfRunningJobs = $runningJobs.length;
	});
</script>

<button
	class="hover:bg-red-900 hover:transition p-3 rounded-md bg-red-950 flex items-center relative"
>
	<JobViewerIcon />
	{#if amtOfRunningJobs > 0}
		<div class="absolute bottom-[-2px] right-[-2px] bg-red-900 rounded-full w-4 h-4 text-xs">
			{amtOfRunningJobs}
		</div>
	{/if}
</button>
