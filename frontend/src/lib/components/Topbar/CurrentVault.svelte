<script lang="ts">
	import { DoorOpen } from '@lendruk/personal-svelte-ui-lib';
	import { vaultStore } from '../../../store';

	let isVaultSelectionOpen = false;

	function onSelectedVaultClick() {
		isVaultSelectionOpen = !isVaultSelectionOpen;
	}
</script>

<button
	on:click={onSelectedVaultClick}
	class="mr-4 hover:bg-red-900 hover:transition relative p-2 flex flex-col items-center bg-red-950 rounded-lg shadow-md"
>
	<div>
		Vault: {$vaultStore?.name}
	</div>
</button>
{#if isVaultSelectionOpen}
	<div class="absolute right-0 mr-6 mt-2 bg-zinc-900 rounded-lg top-10 min-w-[150px]">
		<a
			href="/vaults"
			class="ml-2 flex flex-1 p-4 justify-between items-center bg-red-950 rounded-lg hover:bg-red-900 hover:transition"
		>
			Exit <DoorOpen />
		</a>
	</div>
{/if}
