<script lang="ts">
	import { endpoints } from '$lib/endpoints';
	import { HttpService } from '$lib/services/HttpService';
	import type { WorldMap } from '$lib/types/Worldbuilding/WorldMap';
	import { SimpleTable } from '@lendruk/personal-svelte-ui-lib';

	let maps: WorldMap[] = $state([]);
	let mapInPreview: WorldMap | undefined = $state(undefined);

	$effect(() => {
		HttpService.get<WorldMap[]>(endpoints.worldMaps()).then((data) => {
			maps = data;
		});
	});
</script>

<div class="flex flex-1 flex-col bg-zinc-900 p-2">
	<div class="flex justify-between mb-10">
		<div class="text-3xl">Maps</div>
		<a
			class="flex items-center justify-center p-2 rounded-md hover:bg-red-900 bg-red-950"
			href="/world-building/maps/new">Create Map</a
		>
	</div>
	<SimpleTable rows={maps} cols={[{ header: 'Name', key: 'name' }]} />
	<div>
		{#if mapInPreview}
			<div>Preview</div>
		{/if}
	</div>
</div>
