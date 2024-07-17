<script lang="ts">
	import { page } from '$app/stores';
	import { PUBLIC_VERSION } from '$env/static/public';
	import FolderClosedIcon from '$lib/icons/FolderClosedIcon.svelte';
	import { onMount } from 'svelte';
	import { vaultStore } from '../../../store';
	import ArrowLeft from '../../icons/ArrowLeft.svelte';
	import ArrowRight from '../../icons/ArrowRight.svelte';
	import DownloadIcon from '../../icons/DownloadIcon.svelte';
	import ImagesIcon from '../../icons/ImagesIcon.svelte';
	import InboxIcon from '../../icons/InboxIcon.svelte';
	import PaletteIcon from '../../icons/PaletteIcon.svelte';
	import PenIcon from '../../icons/PenIcon.svelte';
	import PlayIcon from '../../icons/PlayIcon.svelte';
	import TagIcon from '../../icons/TagIcon.svelte';
	import UploadIcon from '../../icons/UploadIcon.svelte';
	import SdUiStatusDisplay from './SDUiStatusDisplay.svelte';

	let isSidebarOpen = true;

	type Route = {
		name: string;
		navHref: string;
		path: string | RegExp;
		icon: ConstructorOfATypedSvelteComponent;
		addon?: ConstructorOfATypedSvelteComponent;
		subNavPaths?: (string | RegExp)[];
		ignoreSubNavPaths?: (string | RegExp)[];
		subRoutes?: Route[];
	};

	let stableDiffusionRoutes: Route[] = [];
	let routes: Route[] = [
		{
			name: 'Upload',
			path: '/',
			navHref: '/',
			icon: UploadIcon
		},
		{
			name: 'Tags',
			path: '/tags',
			navHref: '/tags',
			icon: TagIcon
		},
		{
			name: 'Gallery',
			path: '/gallery',
			navHref: '/gallery',
			ignoreSubNavPaths: ['inbox'],
			icon: ImagesIcon
		},
		{
			name: 'Inbox',
			path: /\/gallery\?inbox=true/g,
			navHref: '/gallery?inbox=true',
			icon: InboxIcon
		},
		{
			name: 'Stable Diffusion',
			navHref: '',
			path: '',
			icon: PaletteIcon,
			subRoutes: []
		},
		{
			name: 'Playlists',
			path: /\/playlists|playlists\/(\d)/g,
			navHref: '/playlists',
			icon: PlayIcon,
			subNavPaths: ['view', /(\d)/g]
		}
	];

	onMount(() => {
		vaultStore.subscribe((vault) => {
			if (vault?.hasInstalledSD) {
				stableDiffusionRoutes = [
					{
						icon: FolderClosedIcon,
						name: 'Resources',
						path: '/stablediffusion/resource-manager',
						navHref: '/stablediffusion/resource-manager'
					},
					{
						icon: PenIcon,
						addon: SdUiStatusDisplay,
						name: 'Generator',
						path: '/stablediffusion/generator',
						navHref: '/stablediffusion/generator'
					}
				];
			} else {
				stableDiffusionRoutes = [
					{
						icon: DownloadIcon,
						name: 'Install',
						path: '/stablediffusion/install',
						navHref: '/stablediffusion/install'
					}
				];
			}
			const index = routes.findIndex((route) => route.name === 'Stable Diffusion');
			routes[index].subRoutes = stableDiffusionRoutes;
			routes = routes;
		});
	});

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

<aside
	class={`bg-zinc-900 flex flex-col justify-between rounded-tr-md rounded-br-md max-w-[200px] relative ${isSidebarOpen ? 'w-2/12' : 'w-[50px]'} relative`}
>
	<div class="sticky top-0">
		{#each routes as route}
			{#if route.subRoutes}
				<div>
					{#if isSidebarOpen}
						<div class="text-md flex items-center gap-4">
							<div class="flex flex-col flex-1">
								<div class="flex gap-4 pl-4 pr-4 pt-2 pb-2">
									{#if route.icon}
										<svelte:component
											this={route.icon}
											width={16}
											class="fill-white"
											height={16}
											color="#FFFFFF"
										/>
									{/if}
									{route.name}
								</div>
								{#each route.subRoutes as subRoute}
									<div class="flex flex-1 flex-col text-sm">
										<a
											href={subRoute.navHref}
											class={`${
												isCurrentPathSelected(subRoute) && 'bg-red-950 text-white'
											} pl-8 pr-4 pt-2 pb-2 text-md flex items-center gap-4 hover:bg-red-950 hover:bg-slate-300 hover:text-white hover:text-zinc-800 hover:transition-all`}
										>
											{#if subRoute.icon}
												<svelte:component
													this={subRoute.icon}
													width={16}
													class="fill-white"
													height={16}
													color="#FFFFFF"
												/>
											{/if}
											<div class="flex flex-1 items-center justify-between">
												{subRoute.name}
												{#if subRoute.addon}
													<svelte:component this={subRoute.addon} />
												{/if}
											</div>
										</a>
									</div>
								{/each}
							</div>
						</div>
					{:else}
						<div class="pl-4 pr-4 pt-2 pb-2 text-md flex flex-col items-center gap-4">
							{#each route.subRoutes as subRoute}
								<a
									href={subRoute.navHref}
									class={`${
										isCurrentPathSelected(subRoute) && 'bg-red-950 text-white'
									} pl-4 pr-4 pt-2 pb-2 text-md flex items-center gap-4 hover:bg-red-950 hover:bg-slate-300 hover:text-white hover:text-zinc-800 hover:transition-all`}
								>
									{#if subRoute.icon}
										<svelte:component
											this={subRoute.icon}
											width={16}
											class="fill-white"
											height={16}
											color="#FFFFFF"
										/>
									{/if}
								</a>
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<a
					class={`${
						isCurrentPathSelected(route) && 'bg-red-950 text-white'
					} pl-4 pr-4 pt-2 pb-2 text-md flex items-center gap-4 hover:bg-red-950 hover:bg-slate-300 hover:text-white hover:text-zinc-800 hover:transition-all`}
					href={route.navHref}
				>
					{#if isSidebarOpen}
						<div class="flex flex-col">
							<div class="flex gap-4 items-center">
								{#if route.icon}
									<svelte:component
										this={route.icon}
										width={16}
										class="fill-white"
										height={16}
										color="#FFFFFF"
									/>
								{/if}
								{route.name}
							</div>
						</div>
					{:else if route.icon}
						<svelte:component
							this={route.icon}
							width={16}
							class="fill-white"
							height={16}
							color="#FFFFFF"
						/>
					{/if}
				</a>
			{/if}
		{/each}
	</div>
	<div class="sticky bottom-0">
		{#if isSidebarOpen}
			<div class="flex flex-col text-xs items-center mb-4">
				<div>NoriBooru</div>
				<div>v{PUBLIC_VERSION}</div>
			</div>
		{/if}
		<button
			on:click={() => (isSidebarOpen = !isSidebarOpen)}
			class={`${isSidebarOpen ? 'absolute right-0 bottom-0 rounded-tl-lg' : 'w-full flex items-center justify-center'}  bg-red-950 p-2 fill-white hover:bg-red-900 hover:transition`}
		>
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
