<script lang="ts">
	import SimpleTable from '$lib/components/SimpleTable.svelte';
	import { endpoints } from '$lib/endpoints';
	import { HttpService } from '$lib/services/HttpService';
	import type { WorldMap } from '$lib/types/Worldbuilding/WorldMap';

	let maps: WorldMap[] = $state([]);
	let mapInPreview: WorldMap | undefined = $state(undefined);

	$effect(() => {
		HttpService.get(endpoints.worldMaps()).then((data) => {});
	});
</script>

<div class="flex flex-1">
	<div>
		{#if maps.length > 0}
			<SimpleTable />
		{:else}
			<div>No maps founds</div>
		{/if}
	</div>
	<div>
		{#if mapInPreview}
			<div>Preview</div>
		{/if}
	</div>
</div>
