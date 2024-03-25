<script lang="ts">
	import { page } from '$app/stores';
	import ImagesIcon from './icons/ImagesIcon.svelte';
	import PlayIcon from './icons/PlayIcon.svelte';
	import TagIcon from './icons/TagIcon.svelte';
  import { PUBLIC_VERSION } from '$env/static/public';
	import InboxIcon from './icons/InboxIcon.svelte';
	import UploadIcon from './icons/UploadIcon.svelte';
	import ArrowRight from './icons/ArrowRight.svelte';
	import ArrowLeft from './icons/ArrowLeft.svelte';

	let isSidebarOpen = true;

	type Route = {
		name: string;
		navHref: string;
		path: string | RegExp;
		icon: ConstructorOfATypedSvelteComponent;
		subNavPaths?: (string | RegExp)[];
		ignoreSubNavPaths?: (string | RegExp)[];
	}

	let routes: Route[] = [
		{
			name: 'Upload',
			path: '/',
			navHref: '/',
      icon: UploadIcon,
		},
		{
			name: 'Tags',
			path: '/tags',
			navHref: '/tags',
			icon: TagIcon,
		},
		{
			name: 'Gallery',
			path: '/gallery',
			navHref: '/gallery',
			ignoreSubNavPaths: ['inbox'],
      icon: ImagesIcon,
		},
		{
			name: 'Inbox',
			path: /\/gallery\?inbox=true/g,
			navHref: '/gallery?inbox=true',
      icon: InboxIcon,
		},
		{
			name: 'Playlists',
			path: /\/playlists|playlists\/(\d)/g,
			navHref: '/playlists',
      icon: PlayIcon,
			subNavPaths: ['view', /(\d)/g]
		}
	];

  function isCurrentPathSelected(route: Route): boolean {
		if ($page.url.pathname === '/') {
			return route.path === '/';
		} 
		const pathName = $page.url.pathname.slice() + $page.url.search;

		if (typeof route.path === 'string') {
			return route.path === pathName;
		} else {
			return route.path.test(pathName);
		}
	}
</script>

<aside class={`bg-zinc-900 flex flex-col justify-between rounded-tr-md rounded-br-md max-w-[200px] relative ${isSidebarOpen ? 'w-2/12' : 'w-[50px]'}`}>
  <div>
    {#each routes as route}
      <a
        class={`${
          isCurrentPathSelected(route) && 'bg-red-950 text-white'
        } pl-4 pr-4 pt-2 pb-2 text-md flex items-center gap-4 hover:bg-red-950 hover:bg-slate-300 hover:text-white hover:text-zinc-800 hover:transition-all`}
        href={route.navHref}>
				{#if route.icon} 
					<svelte:component this={route.icon} width={16} class="fill-white" height={16} color="#FFFFFF"/> 	
				{/if}
				{#if isSidebarOpen}
					<div>{route.name}</div>
				{/if}
			</a>
    {/each}
  </div>
	<div class="sticky bottom-0">
		{#if isSidebarOpen}
			<div class="flex flex-col text-xs items-center mb-4">
				<div>NoriBooru</div>
				<div>v{PUBLIC_VERSION}</div>
			</div>
		{/if}
		<button on:click={() => isSidebarOpen = !isSidebarOpen} class={`${isSidebarOpen ? 'absolute right-0 bottom-0 rounded-tl-lg' : 'w-full flex items-center justify-center'}  bg-red-950 p-2 fill-white hover:bg-red-900 hover:transition`}>
			{#if isSidebarOpen}
				<ArrowLeft />
			{:else}
				<ArrowRight />
			{/if}
		</button>
	</div>
</aside>

<style>
	aside {
		color: #fff;
		transition: width 0.2s ease-in-out;
	}

	a {
		color: #fff;
		text-decoration: none;
		margin-bottom: 0.5rem;
	}
</style>
