<script lang="ts">
	import { endpoints } from '$lib/endpoints';
	import { HttpService } from '$lib/services/HttpService';
	import { VaultService } from '$lib/services/VaultService';
	import {
		Button,
		createToast,
		LoadingBackground,
		TextInput
	} from '@lendruk/personal-svelte-ui-lib';
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
