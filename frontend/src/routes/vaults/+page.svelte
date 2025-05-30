<script lang="ts">
	import { goto } from '$app/navigation';
	import { endpoints } from '$lib/endpoints';
	import { HttpService } from '$lib/services/HttpService';
	import { VaultService } from '$lib/services/VaultService';
	import { WebsocketService } from '$lib/services/WebsocketService';
	import type { Vault } from '$lib/types/Vault';
	import type { World } from '$lib/types/Worldbuilding/World';
	import {
		ArrowLeft,
		Button,
		createToast,
		LabeledComponent,
		PenIcon,
		TextInput,
		XIcon
	} from '@lendruk/personal-svelte-ui-lib';
	import { runningJobs } from '../../store';

	let vaults: Vault[] = $state([]);

	let newVaultName = $state('');
	let newVaultPath = $state('');
	let baseVaultDir = $state('');

	let usingCustomVaultDir = $state(false);
	let vaultCreationOpen = $state(false);
	let vaultImportOpen = $state(false);

	let vaultPathCheckTimeout: NodeJS.Timeout | undefined;
	let pathMessage = $state('');
	let isTherePathError = $state(false);

	let vaultImportPath = $state('');

	$effect(() => {
		if (typeof localStorage !== 'undefined') {
			VaultService.removeVault();
			WebsocketService.unregisterWebsocket();
		}
		runningJobs.set([]);
		getVaults();
	});

	async function getVaults() {
		const fetchedVaults = await HttpService.get<{ vaults: Vault[]; baseVaultDir: string }>(
			endpoints.vaults()
		);
		vaults = fetchedVaults.vaults;
		newVaultPath = fetchedVaults.baseVaultDir;
		baseVaultDir = fetchedVaults.baseVaultDir;
	}

	async function checkVaultPath(path: string, checkingForExistingVault?: boolean) {
		if (vaultPathCheckTimeout) {
			clearTimeout(vaultPathCheckTimeout);
			vaultPathCheckTimeout = undefined;
		}

		if (path != '') {
			vaultPathCheckTimeout = setTimeout(async () => {
				try {
					const result = await HttpService.post<{ message: string }>(endpoints.checkVaultPath(), {
						path,
						checkingForExistingVault
					});
					pathMessage = result.message;
					isTherePathError = false;
				} catch (error) {
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
		if (!newVaultName) {
			createToast('Vault name cannot be empty');
			return;
		}
		if (!newVaultPath) {
			createToast('Vault path cannot be empty');
			return;
		}

		try {
			const vault = await HttpService.post<Vault>(endpoints.vaults(), {
				name: newVaultName,
				path: newVaultPath
			});
			newVaultName = '';
			newVaultPath = baseVaultDir;
			usingCustomVaultDir = false;
			pathMessage = '';
			isTherePathError = false;
			vaultCreationOpen = false;
			vaults.push(vault);
			vaults = vaults.slice();
		} catch (error) {
			console.error('Failed to create vault');
		}
	}

	async function importVault() {
		if (!vaultImportPath) {
			createToast('Vault path cannot be empty');
			return;
		}

		try {
			const importedVault = await HttpService.post<Vault>(endpoints.importVault(), {
				path: vaultImportPath
			});
			vaultImportOpen = false;
			vaults.push(importedVault);
			createToast('Vault imported successfully!');
		} catch {
			createToast('Vault import failed');
		}
	}

	async function publishVaultToLocalStorage(vault: Vault) {
		VaultService.setVault(vault);

		try {
			const world = await HttpService.get<World | undefined>(endpoints.world());
			VaultService.setVault({ ...vault, world });
		} catch {}

		goto('/');
		WebsocketService.registerWebsocket();
	}
</script>

<div class="flex flex-row w-full items-center justify-center h-[50%] mt-28 mr-60 ml-60">
	<div
		class="bg-red-950 rounded-tl-sm rounded-bl-sm w-[40%] h-full overflow-y-scroll overflow-x-hidden"
	>
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

		{#if !vaultCreationOpen && !vaultImportOpen}
			<div class="flex p-4 justify-between">
				<div class="flex flex-col">
					<div class="font-semibold">Create a media vault</div>
					<div class="text-xs">Create a new media vault in a directory of your choice</div>
				</div>
				<Button onClick={() => (vaultCreationOpen = true)}>Create</Button>
			</div>
			<div class="flex p-4 justify-between">
				<div class="flex flex-col">
					<div class="font-semibold">Import a media vault</div>
					<div class="text-xs">Import an already existing nori-booru vault</div>
				</div>
				<Button onClick={() => (vaultImportOpen = true)}>Import</Button>
			</div>
		{:else if vaultCreationOpen}
			<div class={`flex flex-col p-4 w-[80%] self-center overflow-scroll`}>
				<button
					class="w-[70px] h-[40px] hover:border-red-900 hover:fill-red-900 fill-white hover:text-red-900 border-b hover:transition flex items-center justify-between border-transparent"
					on:click={() => (vaultCreationOpen = false)}
					><ArrowLeft class="fill-inherit" /> Back
				</button>
				<div class="mt-4 mb-4 flex flex-col gap-2">
					<div class="flex flex-col gap-2">
						<label for="vaultName">Vault name</label>
						<input
							class="h-[40px] outline-none rounded-sm bg-surface-color indent-2 text-white"
							bind:value={newVaultName}
							on:input={() => {
								if (!usingCustomVaultDir) {
									newVaultPath = `${baseVaultDir}/${newVaultName}`;
									checkVaultPath(newVaultPath);
								}
							}}
							name="vaultName"
							type="text"
							placeholder="name..."
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="vaultPath">Vault path</label>
						<div class="flex flex-1 w-full">
							<input
								disabled={!usingCustomVaultDir}
								class={`h-[40px] outline-none w-full rounded-sm bg-surface-color indent-2  ${!usingCustomVaultDir ? 'text-gray-600 cursor-not-allowed' : ''}`}
								bind:value={newVaultPath}
								name="vaultPath"
								type="text"
								placeholder="path..."
								on:input={() => checkVaultPath(newVaultPath)}
							/>
							<Button onClick={() => (usingCustomVaultDir = !usingCustomVaultDir)}>
								{#if usingCustomVaultDir}
									<XIcon class="fill-white" />
								{:else}
									<PenIcon class="fill-white" />
								{/if}
							</Button>
						</div>
						<div class="min-h-[30px]" style={`color:${isTherePathError ? 'red' : 'lightgreen'}`}>
							{pathMessage}
						</div>
					</div>
				</div>
				<Button class="w-[100px] h-[40px] self-end" onClick={createVault}>Create</Button>
			</div>
		{:else if vaultImportOpen}
			<div class={`flex flex-col p-4 w-[80%] self-center overflow-scroll`}>
				<button
					class="w-[70px] h-[40px] hover:border-red-900 hover:fill-red-900 fill-white hover:text-red-900 border-b hover:transition flex items-center justify-between border-transparent"
					on:click={() => (vaultImportOpen = false)}
					><ArrowLeft class="fill-inherit" /> Back
				</button>
				<LabeledComponent>
					<div slot="label">Path</div>
					<TextInput
						slot="content"
						on:input={() => checkVaultPath(vaultImportPath, true)}
						placeholder="Path to vault"
						bind:value={vaultImportPath}
					/>
				</LabeledComponent>
				<div class="min-h-[30px]" style={`color:${isTherePathError ? 'red' : 'lightgreen'}`}>
					{pathMessage}
				</div>
				<Button class="w-[100px] h-[40px] self-end" onClick={importVault}>Import</Button>
			</div>
		{/if}
	</div>
</div>

<svelte:head>
	<title>NoriBooru</title>
</svelte:head>
