<script lang="ts">
	import JobViewerIcon from '$lib/icons/JobViewerIcon.svelte';
	import { runningJobs } from '../../../store';

	let amtOfRunningJobs = $derived($runningJobs.length);
	let isViewPanelOpen = $state(false);
</script>

<button
	class="hover:bg-red-900 hover:transition p-3 rounded-md bg-red-950 flex items-center relative"
	on:click={() => (isViewPanelOpen = !isViewPanelOpen)}
>
	<JobViewerIcon />
	{#if amtOfRunningJobs > 0 && !isViewPanelOpen}
		<div class="absolute bottom-[-2px] right-[-2px] bg-red-900 rounded-full w-4 h-4 text-xs">
			{amtOfRunningJobs}
		</div>
	{/if}
	{#if isViewPanelOpen}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="absolute top-[100%] right-0 w-[400px] h-auto max-h-[400px] overflow-y-scroll bg-red-950 border-2 border-red-950 mt-4 rounded-md"
			on:click={(e) => e.stopPropagation()}
			on:mouseup={(e) => e.stopPropagation()}
		>
			<div class="flex flex-col w-full justify-start">
				<div class="flex justify-center p-2 text-xl border-b-2 border-zinc-800">Current Jobs</div>
				<div class="flex flex-col gap-2 pt-2 pb-2">
					{#if amtOfRunningJobs > 0}
						<div class="flex justify-start pl-2">Most Recent</div>
						{#each $runningJobs as job}
							<div class="flex flex-col gap-2 bg-zinc-900 p-2">
								<div class="flex gap-2 items-center justify-between">
									<div>Job Name: {job.name}</div>
									<div class="text-xs rounded-full bg-red-900 p-1">{job.tag}</div>
								</div>
								{#each Object.entries(job.data) as [key, value]}
									<div class="flex gap-2 items-center justify-between">
										<div>{key}</div>
										<div class="text-xs rounded-full bg-red-900 p-1">{value ?? 'unknown'}</div>
									</div>
								{/each}
							</div>
						{/each}
					{:else}
						<div>No jobs running</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</button>

<svelte:window on:mouseup={() => (isViewPanelOpen = false)} />
