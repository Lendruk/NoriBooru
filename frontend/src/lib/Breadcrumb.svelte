<script lang="ts">
  import  { page } from '$app/stores';
	import House from './icons/House.svelte';
  let path = $state($page.url.pathname.split("/").filter((p) => p));
  $effect(() => {
    path = $page.url.pathname.split("/").filter((p) => p);
  });
</script>

<div class="flex flex-row flex-1 items-center ml-4">
  <a class="flex flex-row fill-white hover:fill-slate-400" href="/"><House /></a>
  {#each path as p, i}
    <span class="text-slate-500 pr-1 pl-1">/</span>
    <a
      href="/{path.slice(0, i + 1).join("/")}"
      class="text-white hover:text-slate-400"
    >
      {p}
    </a>
  {/each}
</div>