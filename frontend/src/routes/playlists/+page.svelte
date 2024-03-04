<script lang="ts">
	import TrashIcon from '$lib/icons/TrashIcon.svelte';
  import PlayIcon from '$lib/icons/PlayIcon.svelte';
	import { HttpService } from '$lib/services/HttpService';
  import type {SimplePlaylist} from '$lib/types/SimplePlaylist';
	import SimpleTable from '$lib/SimpleTable.svelte';

  let playlists: SimplePlaylist[] = $state([]);

  $effect(() => {
    HttpService.get<SimplePlaylist[]>(`/playlists`).then(res => {
      playlists = res;
    });
  });

  async function deletePlaylist(playlistId: number) {
    await HttpService.delete(`/playlists/${playlistId}`);
    playlists = playlists.filter(playlist => playlist.id !== playlistId);
  }
</script>

<div class="m-2 bg-zinc-900 rounded-md p-4">
  <div class="flex justify-between mb-10">
    <div class="text-3xl">
      Playlists
    </div>
    <a class="flex items-center justify-center p-2 rounded-md hover:bg-red-900 bg-red-950" href="/playlists/new">Create playlist</a>
  </div>

  <div class="flex flex-col flex-1">
    {#if playlists.length > 0}
      <div class="p-4 pl-8 bg-red-950">
        <div>Name</div>
      </div>
    {#each playlists as playlist}
      <div class="flex flex-row p-8 hover:bg-slate-700 items-center hover:transition">
        <a href={playlist.items > 0 ? `/playlists/view/${playlist.id}` : `#`} class={`pr-4 ${playlist.items === 0 && 'cursor-not-allowed'}`}>
          <PlayIcon /> 
        </a>
        <a href={`/playlists/${playlist.id}`}>{playlist.name} ({playlist.items} Items)</a>
        <div class="flex flex-1"></div>
        <button class="fill-white" on:click={() => deletePlaylist(playlist.id)}>
          <TrashIcon />
        </button>
      </div>
    {/each}
    {:else}
      <div>No playlists</div>
    {/if}
    <SimpleTable cols={[{ key: "name", display: "Name"}, { key:"address", display:"Address"}]} rows={[{ name: "test"}, { name: "test2"}, { name: "test3"}]} actions={[ {icon: PlayIcon, name: "Play", onClick: () => {} }, {icon: TrashIcon, name: "Delete", onClick: () => {} }]}/>
  </div>
</div>