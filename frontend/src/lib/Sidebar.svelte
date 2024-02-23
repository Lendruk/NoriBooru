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

<aside class="bg-zinc-900 rounded-md">
  {#each routes as route}
    <a class={`${$page.url.pathname === route.path && 'active'} ml-2 mr-2 p-2 rounded-md text-md hover:bg-slate-300 hover:text-zinc-800 hover:transition-all`} href={route.path}>{route.name}</a>
  {/each}
</aside>

<style>
  aside {
    color: #fff;
    /* padding: 1rem; */
    width: 10rem;
  }

  .active {
    color: rgb(39 39 42);
    background-color: rgb(203 213 225);
  }

  a {
    display: block;
    color: #fff;
    text-decoration: none;
    margin-bottom: 0.5rem;
  }
</style>