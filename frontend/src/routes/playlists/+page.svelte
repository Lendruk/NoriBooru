<script lang="ts">
	import { goto } from '$app/navigation';
	import SimpleTable from '$lib/SimpleTable.svelte';
	import PlayIcon from '$lib/icons/PlayIcon.svelte';
	import TrashIcon from '$lib/icons/TrashIcon.svelte';
	import EditIcon from '$lib/icons/editIcon.svelte';
	import { HttpService } from '$lib/services/HttpService';
	import type { SimplePlaylist } from '$lib/types/SimplePlaylist';

	let playlists: SimplePlaylist[] = $state([]);

	$effect(() => {
		HttpService.get<SimplePlaylist[]>(`/playlists`).then((res) => {
			playlists = res;
		});
	});

	async function deletePlaylist(playlistId?: number) {
		if (playlistId !== undefined) {
			await HttpService.delete(`/playlists/${playlistId}`);
			playlists = playlists.filter((playlist) => playlist.id !== playlistId);
		}
	}
</script>

<div class=" bg-zinc-900 rounded-md p-4">
	<div class="flex justify-between mb-10">
		<div class="text-3xl">Playlists</div>
		<a
			class="flex items-center justify-center p-2 rounded-md hover:bg-red-900 bg-red-950"
			href="/playlists/new">Create playlist</a
		>
	</div>

	<div class="flex flex-col flex-1">
		{#if playlists.length > 0}
			<SimpleTable
				cols={[{ key: 'name', header: 'Name' }]}
				rows={playlists}
				actions={[
        { icon: EditIcon, name: "Edit", onClick: (id) => { goto(`/playlists/${id}`)}},
        { icon: PlayIcon, name: 'Play', onClick: (id) => { goto(`/playlists/view/${id}`)}, condition: (row) =>  (row as SimplePlaylist).items > 0},
        { icon: TrashIcon, name: 'Delete', onClick: (id) => { deletePlaylist(id as number)} }
      ]}
			/>
		{:else}
			<div>No playlists</div>
		{/if}
	</div>
</div>

<svelte:head>
	<title>NoriBooru - Playlists</title>
</svelte:head>
