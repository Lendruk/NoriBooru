<script lang="ts">
	import { page } from '$app/stores';
	import ImagesIcon from './icons/ImagesIcon.svelte';
	import PlayIcon from './icons/PlayIcon.svelte';
	import TagIcon from './icons/TagIcon.svelte';
  import { PUBLIC_VERSION } from '$env/static/public';
	import InboxIcon from './icons/InboxIcon.svelte';
	import UploadIcon from './icons/UploadIcon.svelte';

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
			path: '/gallery/inbox',
			navHref: '/gallery/inbox',
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
		const pathName = $page.url.pathname.slice();

		if (typeof route.path === 'string') {
			return route.path === pathName;
		} else {
			return route.path.test(pathName);
		}
	}
</script>

<aside class="bg-zinc-900 flex flex-col justify-between rounded-tr-md rounded-br-md w-2/12 max-w-[200px]">
  <div>
    {#each routes as route}
      <a
        class={`${
          isCurrentPathSelected(route) && 'bg-red-950 text-white'
        } pl-4 pr-4 pt-2 pb-2 text-md flex items-center gap-4 hover:bg-red-950 hover:bg-slate-300 hover:text-white hover:text-zinc-800 hover:transition-all`}
        href={route.navHref}>{#if route.icon} <svelte:component this={route.icon} width={16} class="fill-white" height={16} color="#FFFFFF"/> {/if}<div>{route.name}</div></a
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
