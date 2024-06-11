<script lang="ts">
	import Button from "$lib/Button.svelte";
import { HttpService } from "$lib/services/HttpService";



  async function installSD() {
    await HttpService.post(`/sd/install`, {});
  }
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
  <Button onClick={() => installSD() }>
    Install
  </Button>

  <Button onClick={() => HttpService.post(`/sd/start`, {})}>
    Start
  </Button>
  <Button onClick={() => HttpService.post(`/sd/stop`, {})}>
    Stop
  </Button>
</div>