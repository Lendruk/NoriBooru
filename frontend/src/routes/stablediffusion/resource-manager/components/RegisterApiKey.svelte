<script lang="ts">
	import Button from '$lib/Button.svelte';
	import LoadingBackground from '$lib/components/LoadingBackground.svelte';
	import { createToast } from '$lib/components/toast/ToastContainer.svelte';
	import { HttpService } from '$lib/services/HttpService';
	import TextInput from '../../../components/TextInput.svelte';

	let key: string;
	let isLoading: boolean = false;
	let onSubmitDone: () => void;

	async function registerAPIKey() {
		isLoading = true;
		await HttpService.post(`/sd/civitai/register`, {
			key
		});
		isLoading = false;
		onSubmitDone();
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
