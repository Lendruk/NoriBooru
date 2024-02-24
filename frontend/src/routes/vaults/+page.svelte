<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { HttpService } from '$lib/services/HttpService';
	import type { Vault } from '$lib/types/Vault';
	import Button from '$lib/Button.svelte';

	let vaults: Vault[] = [];

	let newVaultName = '';
	let newVaultPath = '';

	let vaultCreationOpen = false;

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
			vaultCreationOpen = false;
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

<div class="flex flex-row w-full items-center justify-center h-[50%] mt-28 mr-60 ml-60">
	<div class="bg-main-bg rounded-tl-sm rounded-bl-sm w-[40%] h-full">
		<div class="flex flex-col p-4">
			{#if vaults.length > 0}
				{#each vaults as vault}
					<button
						on:click={() => publishVaultToLocalStorage(vault)}
						class="p-2 flex items-start justify-start flex-col hover:transition-all rounded-md hover:bg-lighter-bg"
					>
					<div>
						{vault.name}
					</div>
					<div class="text-xs text-gray-300">
						Path: {vault.path}
					</div>
					</button>
				{/each}
			{:else}
				<div>No vaults</div>
			{/if}
		</div>
	</div>
	<div class="flex flex-col rounded-tr-sm rounded-br-sm bg-lighter-bg h-full w-[60%]">
		<h1 class="text-3xl mb-5 flex self-center mt-4">NoriBooru</h1>

		{#if !vaultCreationOpen}
		<div class="flex p-4 justify-between">
			<div class="flex flex-col">
				<div>
					Create a media vault
				</div>
				<div class="text-xs">
					Create a new media vault in a directory of your choice
				</div>
			</div>
			<Button onClick={() => (vaultCreationOpen = true)} >Create</Button>
		</div>

		{:else}
		<div class={`flex flex-col p-4 w-[80%] self-center`}>
			<Button class="w-[100px] h-[40px] bg-lighter-bg" onClick={() => vaultCreationOpen = false }> Back </Button>
			<div class="mt-4 mb-4 flex flex-col gap-2">
				<div class="flex flex-col gap-2">
					<label for="vaultName">Vault name</label>
					<input class="h-[40px] outline-none rounded-sm bg-surface-color indent-2 text-white" bind:value={newVaultName} name="vaultName" type="text" placeholder="name..." />
				</div>
				<div class="flex flex-col gap-2">
					<label for="vaultPath">Vault path</label>
					<input class="h-[40px] outline-none rounded-sm bg-surface-color indent-2 text-white" bind:value={newVaultPath} name="vaultPath" type="text" placeholder="path..." />
				</div>
			</div>
			<Button class="w-[100px] h-[40px] self-end" onClick={createVault}>Create</Button>
		</div>
		{/if}
	</div>
</div>
