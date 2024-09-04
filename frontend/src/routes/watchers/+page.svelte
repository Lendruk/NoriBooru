<script lang="ts">
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

<div class=" bg-zinc-900 rounded-md p-4">
	<div class="flex">
		<div class="flex flex-1 flex-col gap-4">
			<div class="text-xl">Watchers</div>
			<div class="flex flex-col gap-4">
				{#each watchers as watcher}
					<button
						class={`${watcher.id === selectedWatcher?.id ? 'bg-red-950' : ''} flex p-4 flex-col `}
						on:click={() => (selectedWatcher = watcher)}
					>
						<div>{watcher.url}</div>
						<div>{watcher.status}</div>
						<div>
							{watcher.itemsDownloaded} / {watcher.totalItems}
						</div>
					</button>
				{/each}
			</div>
		</div>
		<div class="flex flex-1">
			{#if selectedWatcher}
				<Gallery isInbox={true} watcherId={selectedWatcher.id} usesQueryParams={false} />
			{/if}
		</div>
	</div>
</div>
