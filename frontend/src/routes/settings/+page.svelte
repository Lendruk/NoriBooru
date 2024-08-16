<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import LabeledComponent from '$lib/components/LabeledComponent.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { createToast } from '$lib/components/toast/ToastContainer.svelte';
	import { HttpService } from '$lib/services/HttpService';
	import { VaultService } from '$lib/services/VaultService';
	import { vaultStore } from '../../store';

	let vaultName = $state($vaultStore?.name ?? '');
	let isPerformingDestructiveAction = $state(false);
	let currentAction = $state('');

	async function renameVault() {
		if (!vaultName) {
			createToast('Vault name cannot be empty');
			return;
		}

		await HttpService.put(`/vaults/${$vaultStore?.id}`, {
			name: vaultName
		});
		VaultService.setVault({ ...$vaultStore!, name: vaultName });
		createToast('Vault renamed successfully!');
	}

	async function deleteVault() {
		isPerformingDestructiveAction = true;
		currentAction = 'Deleting vault...';
		await HttpService.delete(`/vaults/${$vaultStore?.id}`);
		VaultService.removeVault();
		goto('/vaults');
		isPerformingDestructiveAction = false;
		createToast('Vault deleted successfully!');
	}

	async function uninstallSDUi() {
		if (!$vaultStore?.hasInstalledSD) {
			createToast('SDUI is not installed');
			return;
		}
		isPerformingDestructiveAction = true;
		currentAction = 'Uninstalling SDUI...';
		await HttpService.post(`/sd/uninstall`);
		VaultService.setVault({ ...$vaultStore!, hasInstalledSD: false });
		createToast('SDUI uninstalled successfully!');
		isPerformingDestructiveAction = false;
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

	<div class="text-xl mb-2">Destructive Actions</div>

	<div class="flex flex-col gap-2">
		<div class="border-2 border-red-950 rounded-md p-4 flex items-center justify-between">
			<div class="flex flex-col">
				<div class="font-bold">Uninstall SDUI</div>
				<div>
					This will uninstall the Stable Diffusion UI from your device. It will remove all
					checkpoints and loras. This action cannot be undone.
				</div>
			</div>
			<Button
				class={`${!$vaultStore?.hasInstalledSD ? 'cursor-not-allowed bg-surface-color text-red-800 ' : ''}`}
				onClick={uninstallSDUi}>Uninstall SDUI</Button
			>
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
