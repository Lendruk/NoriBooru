<script lang="ts">
	import { page } from '$app/stores';
	import ImagesIcon from './icons/ImagesIcon.svelte';
	import PlayIcon from './icons/PlayIcon.svelte';
	import TableColumnsIcon from './icons/TableColumnsIcon.svelte';
	import TagIcon from './icons/TagIcon.svelte';
  import { PUBLIC_VERSION } from '$env/static/public';
	import InboxIcon from './icons/InboxIcon.svelte';
	let routes = [
		{
			name: 'Dashboard',
			path: '/',
      icon: TableColumnsIcon,
		},
		{
			name: 'Tags',
			path: '/tags',
			icon: TagIcon,
		},
		{
			name: 'Gallery',
			path: '/gallery',
      icon: ImagesIcon,
		},
		{
			name: 'Inbox',
			path: '/gallery/inbox',
      icon: InboxIcon,
		},
		{
			name: 'Playlists',
			path: '/playlists',
      icon: PlayIcon,
		}
	];

  
</script>

<aside class="bg-zinc-900 flex flex-col justify-between rounded-tr-md rounded-br-md w-2/12 max-w-[200px]">
  <div>
    {#each routes as route}
      <a
        class={`${
          $page.url.pathname === route.path && 'bg-red-950 text-white'
        } pl-4 pr-4 pt-2 pb-2 text-md flex items-center gap-4 hover:bg-red-950 hover:bg-slate-300 hover:text-white hover:text-zinc-800 hover:transition-all`}
        href={route.path}>{#if route.icon} <svelte:component this={route.icon} width={16} class="fill-white" height={16} color="#FFFFFF"/> {/if}<div>{route.name}</div></a
      >
    {/each}
  </div>
  <div class="flex flex-col text-xs items-center mb-4">
    <div>NoriBooru</div>
    <div>v{PUBLIC_VERSION}</div>
  </div>
</aside>

<style>
	aside {
		color: #fff;
	}

	a {
		color: #fff;
		text-decoration: none;
		margin-bottom: 0.5rem;
	}
</style>
