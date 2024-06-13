<script lang="ts">
	import Button from "$lib/Button.svelte";
  import { HttpService } from "$lib/services/HttpService";
	import { onMount } from "svelte";
	import { vaultStore } from "../../../store";
	import { beforeNavigate } from "$app/navigation";

  async function setup() {
    await HttpService.post(`/sd/start`, {});
  }
  beforeNavigate(async () => {
    console.log("inactive");
    await HttpService.post(`/sd/inactive`, {});
  });

  onMount(() => {
    void setup();
  });
</script>

<div class="m-2 bg-zinc-900 rounded-md p-4 flex flex-col">
  <div class="flex flex-col">
    <div class="flex flex-col">
      <div>Prompt</div>
      <textarea />
    </div>
    <div class="flex flex-col">
      <div>Negative Prompt</div>
      <textarea />
    </div>
  </div>
  <Button onClick={() => HttpService.post(`/sd/start`, {})}>
    Start
  </Button>
  <Button onClick={() => HttpService.post(`/sd/stop`, {})}>
    Stop
  </Button>

  {#if $vaultStore?.hasInstalledSD}
    Has installed sd
  {:else}
    NO sd install
  {/if}
</div>