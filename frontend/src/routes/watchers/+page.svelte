<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Link from '$lib/components/Link.svelte';
	import LinkIcon from '$lib/icons/LinkIcon.svelte';
	import { HttpService } from '$lib/services/HttpService';
	import type { Watcher } from '$lib/types/Watcher';
	import Gallery from '../gallery/Gallery.svelte';

	let watchers: Watcher[] = $state([]);
	let selectedWatcher: Watcher | undefined = $state(undefined);

	$effect(() => {
		HttpService.get<{ watchers: Watcher[] }>(`/watchers`).then(async (res) => {
			watchers = res.watchers;

			if (watchers.length > 0) {
				selectedWatcher = watchers[0];
			}
		});
	});
</script>

<div class=" bg-zinc-900 rounded-md h-full p-4">
	<div class="flex h-full">
		<div class="flex flex-[0.5] flex-col gap-4 border-r-2 border-red-950 pr-2 top-0">
			<div class="flex justify-between items-center">
				<div class="text-xl">Page Watchers</div>
				<Button>New</Button>
			</div>
			{#if watchers.length > 0}
				<div class="flex flex-col gap-2 overflow-scroll">
					{#each watchers as watcher}
						<button
							class={`${watcher.id === selectedWatcher?.id ? 'bg-red-950' : 'hover:bg-red-900 transition-all'} flex p-4`}
							on:click={() => (selectedWatcher = watcher)}
						>
							<div class="w-full">
								<div class="flex justify-between w-full items-center">
									<div>{watcher.url}</div>
									<Link
										class={`${watcher.id === selectedWatcher?.id ? 'bg-zinc-900' : ''}`}
										href={watcher.url}
										target="_blank"><LinkIcon /></Link
									>
								</div>
								<div class="flex justify-between flex-1 items-center">
									<div class="flex gap-2">
										<div>Updated at</div>
										<div>{new Date(watcher.lastRequestedAt).toLocaleString()}</div>
									</div>
									<div class="flex gap-2">
										<div>{watcher.status}</div>
										<div>
											{watcher.itemsDownloaded} / {watcher.totalItems}
										</div>
									</div>
								</div>
							</div>
						</button>
					{/each}
				</div>
			{:else}
				<div class="text-4xl">No watchers found</div>
			{/if}
		</div>
		{#if selectedWatcher}
			<div class="flex flex-1 flex-col pl-2">
				<div class="text-xl flex items-center h-[40px]">Downloaded Items</div>
				<Gallery
					watcherId={selectedWatcher.id}
					scrollOnOverflow={true}
					usesQueryParams={false}
					showFilterButton={false}
					showReviewButton={false}
				/>
			</div>
		{/if}
	</div>
</div>
