<script lang="ts">
	import { goto } from '$app/navigation';
	import { endpoints } from '$lib/endpoints';
	import { HttpService } from '$lib/services/HttpService';
	import { VaultService } from '$lib/services/VaultService';
	import {
		Button,
		createToast,
		LabeledComponent,
		LoadingSpinner,
		TextInput
	} from '@lendruk/personal-svelte-ui-lib';
	import { vaultStore } from '../../store';

	let vaultName = $state($vaultStore?.name ?? '');
	let isPerformingDestructiveAction = $state(false);
	let currentAction = $state('');
	let civitaiApiKey = $state($vaultStore?.civitaiApiKey ?? '');

	$effect(() => {
		HttpService.get<{ civitai: string }>(endpoints.getApiKeys()).then((res) => {
			civitaiApiKey = res?.civitai;
		});
	});

	async function setCivitaiApiKey() {
		await HttpService.post(endpoints.registerCivitaiAPIKey(), { key: civitaiApiKey });
	}

	async function renameVault() {
		if (!vaultName) {
			createToast('Vault name cannot be empty');
			return;
		}

		await HttpService.put(endpoints.renameVault(), {
			name: vaultName
		});
		VaultService.setVault({ ...$vaultStore!, name: vaultName });
		createToast('Vault renamed successfully!');
	}

	async function deleteVault() {
		isPerformingDestructiveAction = true;
		currentAction = 'Deleting vault...';
		await HttpService.delete(endpoints.vault({ id: $vaultStore?.id }));
		VaultService.removeVault();
		goto('/vaults');
		isPerformingDestructiveAction = false;
		createToast('Vault deleted successfully!');
	}


	async function unlinkVault() {
		isPerformingDestructiveAction = true;
		currentAction = 'Unlinking vault...';
		await HttpService.post(endpoints.unlinkVault());
		VaultService.removeVault();
		goto('/vaults');
		isPerformingDestructiveAction = false;
		createToast('Vault unlinked successfully!');
	}

	$effect(() => {
		vaultName = $vaultStore?.name ?? '';
	});
</script>

<div class=" bg-zinc-900 rounded-md p-4 flex flex-col">
	<div class="text-xl">Settings</div>

	<LabeledComponent>
		<div slot="label">Rename Vault</div>
		<div slot="content" class="flex gap-2">
			<TextInput bind:value={vaultName} />
			<Button onClick={renameVault}>Rename</Button>
		</div>
	</LabeledComponent>

	<div class="text-xl mb-2">Api Keys</div>
	<LabeledComponent>
		<div slot="label">Civitai API Key</div>
		<div slot="content" class="flex gap-2">
			<TextInput isBlurred={true} bind:value={civitaiApiKey} />
			<Button onClick={setCivitaiApiKey}>Set</Button>
		</div>
	</LabeledComponent>

	<div class="text-xl mb-2">Destructive Actions</div>

	<div class="flex flex-col gap-2">
		<div class="border-2 border-red-950 rounded-md p-4 flex items-center justify-between">
			<div class="flex flex-col">
				<div class="font-bold">Unlink this Vault</div>
				<div>
					This will unlink the vault from your NoriBooru instance. This won't however delete any of
					the vault data. You can re-import the vault later.
				</div>
			</div>
			<Button onClick={unlinkVault}>Unlink this Vault</Button>
		</div>
		<div class="border-2 border-red-950 rounded-md p-4 flex items-center justify-between">
			<div class="flex flex-col">
				<div class="font-bold">Delete this Vault</div>
				<div>
					This will delete the vault and all its media items from your device. This action cannot be
					undone.
				</div>
			</div>
			<Button onClick={deleteVault}>Delete this Vault</Button>
		</div>
	</div>
</div>

<!-- TODO: fix This is not blocking the user from navigating away and attempting to perform other actions-->

{#if isPerformingDestructiveAction}
	<div
		class="absolute top-0 left-0 w-full h-full flex backdrop-blur-lg items-center flex-col justify-center"
	>
		<LoadingSpinner />
		<div class="text-2xl">{currentAction}</div>
	</div>
{/if}
<svelte:head>
	<title>NoriBooru - Settings</title>
</svelte:head>
