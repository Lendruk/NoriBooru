<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import ItemPreview from '$lib/components/ItemPreview.svelte';
	import Topbar from '$lib/components/Topbar/index.svelte';
	import { VaultService } from '$lib/services/VaultService';
	import { WebsocketService } from '$lib/services/WebsocketService';
	import type { Vault } from '$lib/types/Vault';
	import {
		CircleDown,
		FlagIcon,
		FolderClosedIcon,
		ImagesIcon,
		InboxIcon,
		LocationPinIcon,
		MapIcon,
		PaletteIcon,
		PenIcon,
		PlayIcon,
		SettingsIcon,
		Sidebar,
		SwordIcon,
		TagIcon,
		ToastContainer,
		UploadIcon,
		UserIcon,
		WorldIcon
	} from '@lendruk/personal-svelte-ui-lib';
	import { onMount } from 'svelte';
	import { vaultStore } from '../store';

	import SdUiStatusDisplay from '$lib/components/sidebar/SDUiStatusDisplay.svelte';
	import '../app.css';

	let stableDiffusionRoutes: any[] = [];
	let pathName = $page.url.pathname.slice() + $page.url.search;
	let routes: any[] = [
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
			ignoreSubNavPaths: ['/gallery/inbox'],
			icon: ImagesIcon
		},
		{
			name: 'Inbox',
			path: '/gallery/inbox',
			navHref: '/gallery/inbox',
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
			path: '/playlists',
			navHref: '/playlists',
			icon: PlayIcon
		},
		{
			name: 'Page Watchers',
			path: '/watchers',
			navHref: '/watchers',
			icon: CircleDown
		},
		// {
		// 	name: 'World Building',
		// 	path: '',
		// 	navHref: '',
		// 	subRoutes: [],
		// 	icon: WorldIcon
		// },
		{
			name: 'Settings',
			path: '/settings',
			navHref: '/settings',
			icon: SettingsIcon
		}
	];

	$: {
		pathName = $page.url.pathname.slice() + $page.url.search;
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
				path: /stablediffusion\/generator\/(.+)/g,
				navHref: '/stablediffusion/generator/new'
			}
		];

		let worldBuildingRoutes: any[] = [];
		if ($vaultStore?.world) {
			worldBuildingRoutes = [
				{
					name: 'World',
					path: '/world-building/world/current',
					navHref: '/world-building/world/current',
					icon: WorldIcon
				},
				{
					name: 'Characters',
					path: '/world-building/characters',
					navHref: '/world-building/characters',
					icon: UserIcon
				},
				{
					name: 'Locations',
					path: '/world-building/locations',
					navHref: '/world-building/locations',
					icon: LocationPinIcon
				},
				{
					name: 'Nations',
					path: '/world-building/nations',
					navHref: '/world-building/nations',
					icon: FlagIcon
				},
				{
					name: 'Maps',
					path: '/world-building/maps',
					navHref: '/world-building/maps',
					icon: MapIcon
				},
				{
					name: 'Items',
					path: '/world-building/items',
					navHref: '/world-building/items',
					icon: SwordIcon
				}
			];
		} else {
			// Commenting out the world building for now
			// worldBuildingRoutes = [
			// 	{
			// 		name: 'Create World',
			// 		path: '/world-building/world/new',
			// 		navHref: '/world-building/world/new',
			// 		icon: WorldIcon
			// 	}
			// ];
		}

		const sdIndex = routes.findIndex((route) => route.name === 'Stable Diffusion');
		routes[sdIndex].subRoutes = stableDiffusionRoutes;

		// const wbIndex = routes.findIndex((route) => route.name === 'World Building');
		// routes[wbIndex].subRoutes = worldBuildingRoutes;
		routes = routes;
	}

	onMount(() => {
		document.documentElement.className = 'darkTheme';
		const curVault = localStorage.getItem('currentVault');

		if (!curVault) {
			goto('/vaults');
		} else {
			VaultService.setVault(JSON.parse(curVault) satisfies Vault);
		}

		WebsocketService.registerWebsocket();
	});
</script>

<div class="flex flex-1 w-full max-h-full">
	{#if !$page.url.pathname.includes('/vaults')}
		<Sidebar bind:routes />
		<main>
			<Topbar />
			<div class="slot m-2 overflow-y-scroll overflow-x-clip">
				<slot />
			</div>
		</main>
	{:else}
		<slot />
	{/if}
</div>
<ItemPreview />
<ToastContainer />

<style lang="postcss">
	.slot {
		height: 100%;
	}

	main {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	:global(html.darkTheme) {
		background-color: #121212;
		color: #fff;
	}

	:global(body) {
		margin: 0;
		display: flex;
		flex: 1;
		height: 100vh;
	}

	:global(input) {
		background-color: rgb(54, 59, 61);
	}
</style>
