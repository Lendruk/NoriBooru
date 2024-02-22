<script lang="ts">
	import TrashIcon from '$lib/client/icons/TrashIcon.svelte';
  import PlayIcon from '$lib/client/icons/PlayIcon.svelte';
	import { HttpService } from '$lib/client/services/HttpService';
	import type { SimplePlaylist } from '../api/playlists/+server';

  let playlists: SimplePlaylist[] = $state([]);

  $effect(() => {
    HttpService.get<SimplePlaylist[]>(`/api/playlists`).then(res => {
      playlists = res;
    });
  });

  async function deletePlaylist(playlistId: number) {
    await HttpService.delete(`/api/playlists/${playlistId}`);
    playlists = playlists.filter(playlist => playlist.id !== playlistId);
  }
</script>

<div>
  <div>
    <a href="/playlists/new">Create playlist</a>
  </div>

  <div class="flex flex-col flex-1">
    {#if playlists.length > 0}
      <div class="p-4 pl-8 bg-slate-900">
        <div>Name</div>
      </div>
    {#each playlists as playlist}
      <div class="flex flex-row p-8 hover:bg-slate-700 items-center hover:transition">
        <a href={playlist.items > 0 ? `/playlists/view/${playlist.id}` : `#`} class={`pr-4 ${playlist.items === 0 && 'cursor-not-allowed'}`}>
          <PlayIcon /> 
        </a>
        <a href={`/playlists/${playlist.id}`}>{playlist.name} ({playlist.items} Items)</a>
        <div class="flex flex-1"></div>
        <button on:click={() => deletePlaylist(playlist.id)}>
          <TrashIcon />
        </button>
      </div>
    {/each}
    {:else}
      <div>No playlists</div>
    {/if}
  </div>
</div>