<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { HttpService } from '$lib/services/HttpService';
	import type { Vault } from '$lib/types/Vault';
	import PlayIcon from '$lib/icons/PlayIcon.svelte';
	let showCreateMenu = false;

	let vaults: Vault[] = [];

	let newVaultName = '';
	let newVaultPath = '';

	onMount(async () => {
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem('currentVault');
		}

		await getVaults();
	});

	async function getVaults() {
		const fetchedVaults = await HttpService.get<Vault[]>('/vaults');
		vaults = fetchedVaults;
	}

	async function createVault() {
		if (!newVaultName || !newVaultPath) {
			return;
		}

		try {
      const vault = await HttpService.post<Vault>('/vaults', {
        name: newVaultName,
        path: newVaultPath
      });
      newVaultName = '';
      newVaultPath = '';
      showCreateMenu = false;
      vaults.push(vault);
      vaults = vaults.slice();
      
    } catch(error) {
      console.error('Failed to create vault');
    }
	}

	function publishVaultToLocalStorage(vault: Vault) {
		localStorage.setItem('currentVault', JSON.stringify(vault));
		goto('/');
	}
</script>

<div class="flex flex-col flex-1 items-center mt-28">
	<h1 class="text-3xl mb-5">Enter vault</h1>
	<div class="bg-slate-800 rounded-sm min-w-[33%]">
		<div class="flex flex-col p-4">
			{#if vaults.length > 0}
				{#each vaults as vault}
					<div
						class="p-2 flex flex-1 flex-row items-center justify-between hover:transition-all hover:bg-slate-950"
					>
						{vault.name}
						<button on:click={() => publishVaultToLocalStorage(vault)}><PlayIcon /></button>
					</div>
				{/each}
			{:else}
				<div>No vaults</div>
			{/if}
		</div>
		<button
			class="border-t-2 flex flex-1 w-full pl-4 pb-4 pt-4"
			on:click={() => (showCreateMenu = true)}>Create Vault</button
		>
	</div>
	<div class={`flex flex-col ${showCreateMenu ? 'flex' : 'hidden'}`}>
		<input bind:value={newVaultName} name="vaultName" type="text" placeholder="Vault name" />
		<input bind:value={newVaultPath} name="vaultPath" type="text" placeholder="Path" />
		<button onclick={createVault}>Create</button>
	</div>
</div>
