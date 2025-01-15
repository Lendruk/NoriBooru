<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import LoadingBackground from '$lib/components/LoadingBackground.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import { createToast } from '$lib/components/toast/ToastContainer.svelte';
	import { endpoints } from '$lib/endpoints';
	import { HttpService } from '$lib/services/HttpService';
	import { VaultService } from '$lib/services/VaultService';
	import { vaultStore } from '../../../../store';

	let key: string;
	let isLoading: boolean = false;

	async function registerAPIKey() {
		isLoading = true;
		await HttpService.post(endpoints.registerCivitaiAPIKey(), {
			key
		});
		isLoading = false;
		VaultService.setVault({ ...$vaultStore!, civitaiApiKey: key });
		createToast('Civitai api key registered successfully!');
	}
</script>

<div class="flex w-full flex-col gap-4 relative">
	{#if isLoading}
		<LoadingBackground />
	{/if}
	<div>Register Civitai API Key</div>
	<TextInput bind:value={key} />
	<Button onClick={registerAPIKey} class="h-[40px]">Submit</Button>
</div>
