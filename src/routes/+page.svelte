<script lang="ts">
	import { HttpService } from "$lib/client/services/HttpService";

  function processInbox() {
    HttpService.post('/api/inbox', {
      method: 'POST',
    });
  }

  let inboxFiles: string[] = $state([]);

  $effect(() => {
    HttpService.get<string[]>("/api/inbox").then(files => {
      inboxFiles = files;
    })
  })

</script>


<div class="p-2">
  <div class="bg-zinc-900 p-2 rounded-md">
    <div>Inbox</div>
    <div>
      {#if inboxFiles.length > 0}
        {#each inboxFiles as file}
        <div>{file}</div>
        {/each}
      {:else}
        <span>Inbox is clear!</span>
      {/if}
    </div>
    <button on:click={processInbox}>
      Process
    </button>
  </div>
</div>