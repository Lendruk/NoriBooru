<script lang="ts">
	import { page } from "$app/stores";
  let routes = [
    {
      name: "Dashboard",
      path: "/"
    },
    {
      name: "Tags",
      path: "/tags"
    },
    {
      name: "Gallery",
      path: "/gallery"

    },
    {
      name: "Playlists",
      path: "/playlists"
    },
  ];
  
</script>

<aside class="bg-zinc-900 rounded-tr-md rounded-br-md">
  {#each routes as route}
    <a class={`${$page.url.pathname === route.path && 'bg-surface-color text-white'} pl-4 pr-4 pt-2 pb-2 text-md hover:bg-surface-color hover:bg-slate-300 hover:text-white hover:text-zinc-800 hover:transition-all`} href={route.path}>{route.name}</a>
  {/each}
</aside>

<style>
  aside {
    color: #fff;
    /* padding: 1rem; */
    width: 10rem;
  }

  a {
    display: block;
    color: #fff;
    text-decoration: none;
    margin-bottom: 0.5rem;
  }
</style>