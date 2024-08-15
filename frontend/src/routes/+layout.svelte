<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Sidebar from '$lib/components/sidebar/Sidebar.svelte';
	import ToastContainer from '$lib/components/toast/ToastContainer.svelte';
	import Topbar from '$lib/components/Topbar/index.svelte';
	import { VaultService } from '$lib/services/VaultService';
	import { WebsocketService } from '$lib/services/WebsocketService';
	import type { Vault } from '$lib/types/Vault';
	import { onMount } from 'svelte';
	import '../app.css';

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

<div class="flex flex-1 w-full">
	{#if !$page.url.pathname.includes('/vaults')}
		<Sidebar />
		<main>
			<Topbar />
			<div class="slot m-2">
				<slot />
			</div>
		</main>
	{:else}
		<slot />
	{/if}
</div>
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
		min-height: 100vh;
	}

	:global(input) {
		background-color: rgb(54, 59, 61);
	}
</style>
