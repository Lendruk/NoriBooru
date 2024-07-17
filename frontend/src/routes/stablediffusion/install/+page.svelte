<script lang="ts">
	import { goto } from '$app/navigation';
	import loadingSpinner from '$lib/assets/tail-spin.svg';
	import Button from '$lib/Button.svelte';
	import { HttpService } from '$lib/services/HttpService';
	import { vaultStore } from '../../../store';
	let installing = false;

	async function installSD() {
		installing = true;
		if (!$vaultStore?.hasInstalledSD) {
			await HttpService.post(`/sd/install`);
			vaultStore.set({ ...$vaultStore!, hasInstalledSD: true });
			setTimeout(() => {
				goto('/stablediffusion/generator');
			}, 250);
		}
		installing = false;
	}
</script>

<div class=" bg-zinc-900 rounded-md p-4 flex flex-1 flex-col h-full">
	<div class="flex w-full h-full items-center justify-center">
		<Button onClick={() => installSD()} class="text-4xl p-4 w-[40%] h-[100px] flex gap-10">
			<div>
				{#if installing}
					Installing
				{:else}
					Install
				{/if}
			</div>
			{#if installing}
				<img class="w-[45px] h-[45px]" src={loadingSpinner} alt="spinner" />
			{/if}
		</Button>
	</div>
</div>
