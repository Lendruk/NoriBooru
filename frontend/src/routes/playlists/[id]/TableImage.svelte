<script lang="ts">
	import { HttpService } from "$lib/services/HttpService";
	import type { MediaItem } from "$lib/types/MediaItem";
  export let row: MediaItem;
</script>

<div class="w-[70px] h-[70px]">
  {#if row.type === "image"}
    <img class="bg-cover" src={`${HttpService.BASE_URL}/images/${HttpService.getVaultId()}/${row.fileName}.${row.extension}`} alt="gallery-img" />
  {:else}
    <video class="bg-cover w-full h-full" src={`/videos/${HttpService.getVaultId()}/${row.fileName}.${row.extension}`} controls={false}/>
  {/if}
</div>