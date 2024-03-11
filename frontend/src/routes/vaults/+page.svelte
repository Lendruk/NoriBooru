<script lang="ts">
	import { goto } from '$app/navigation';
	import { HttpService } from '$lib/services/HttpService';
	import type { Vault } from '$lib/types/Vault';
	import Button from '$lib/Button.svelte';
	import ArrowLeft from '$lib/icons/ArrowLeft.svelte';

	let vaults: Vault[] = $state([]);

	let newVaultName = $state('');
	let newVaultPath = $state('');
	let vaultCreationOpen = $state(false);

	let vaultPathCheckTimeout: NodeJS.Timeout | undefined;
	let pathMessage = $state('');
	let isTherePathError = $state(false);

	$effect(() => {
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem('currentVault');
		}
		getVaults();
	});

	async function getVaults() {
		const fetchedVaults = await HttpService.get<Vault[]>('/vaults');
		vaults = fetchedVaults;
	}

	async function checkVaultPath() {

		if (vaultPathCheckTimeout) {
			clearTimeout(vaultPathCheckTimeout);
			vaultPathCheckTimeout = undefined;
		}

		if (newVaultPath != "") {
			vaultPathCheckTimeout = setTimeout(async () => {
				try {
					await HttpService.post<{ message: string}>('/vaults/check-path', {
						path: newVaultPath
					});
					pathMessage = 'Directory is valid';
					isTherePathError = false;
				} catch(error) {
					pathMessage = (error as Error).message;
					isTherePathError = true;
				}

			}, 500);
		} else {
			pathMessage = '';
			isTherePathError = false;
		}
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
			pathMessage = '';
			isTherePathError = false;
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
	<div class="bg-red-950 rounded-tl-sm rounded-bl-sm w-[40%] h-full overflow-y-scroll overflow-x-hidden">
		<div class="flex flex-col p-4">
			{#if vaults.length > 0}
				{#each vaults as vault}
					<button
						on:click={() => publishVaultToLocalStorage(vault)}
						class="p-2 flex items-start max-h-[10%] justify-start flex-col hover:transition-all rounded-md hover:bg-zinc-900"
					>
					<div class="text-ellipsis overflow-x-clip max-w-full">
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
	<div class="flex flex-col rounded-tr-sm rounded-br-sm bg-zinc-900 h-full w-[60%]">
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
			<button class="w-[70px] h-[40px] hover:border-red-900 hover:fill-red-900 fill-white hover:text-red-900 border-b hover:transition flex items-center justify-between border-transparent" on:click={() => vaultCreationOpen = false }><ArrowLeft class="fill-inherit"/> Back </button>
			<div class="mt-4 mb-4 flex flex-col gap-2">
				<div class="flex flex-col gap-2">
					<label for="vaultName">Vault name</label>
					<input class="h-[40px] outline-none rounded-sm bg-surface-color indent-2 text-white" bind:value={newVaultName} name="vaultName" type="text" placeholder="name..." />
				</div>
				<div class="flex flex-col gap-2">
					<label for="vaultPath">Vault path</label>
					<input 
						class="h-[40px] outline-none rounded-sm bg-surface-color indent-2 text-white" 
						bind:value={newVaultPath} 
						name="vaultPath" 
						type="text" 
						placeholder="path..." 
						on:input={checkVaultPath}
					/>
					<div class="min-h-[30px]" style={`color:${isTherePathError ? 'red' : 'lightgreen'}`}>{pathMessage}</div>
				</div>
			</div>
			<Button class="w-[100px] h-[40px] self-end" onClick={createVault}>Create</Button>
		</div>
		{/if}
	</div>
</div>

<svelte:head>
	<title>NoriBooru</title>
</svelte:head>