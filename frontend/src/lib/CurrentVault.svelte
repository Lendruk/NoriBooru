<script lang="ts">
	import DoorOpen from "./icons/DoorOpen.svelte";
	import type { Vault } from "./types/Vault";

  let currentVault: Vault | null = null;
  let isVaultSelectionOpen = false;

  if (typeof localStorage !== 'undefined') {
    let storageVault = localStorage?.getItem("currentVault");
    currentVault = storageVault ? JSON.parse(storageVault) : null;
  }
</script>

<button on:click={() => isVaultSelectionOpen = !isVaultSelectionOpen} class="mr-4 hover:bg-red-900 hover:transition relative p-2 flex flex-col items-center bg-red-950 rounded-lg shadow-md">
  <div>
    Vault: {currentVault?.name}
  </div>
</button>
{#if isVaultSelectionOpen} 
  <div class="absolute right-0 mr-6 mt-2 bg-zinc-900 rounded-lg top-10 min-w-[150px]">
    <a href="/vaults" class="ml-2 flex flex-1 p-4 justify-between items-center bg-red-950 rounded-lg hover:bg-red-900 hover:transition">
      Exit <DoorOpen />
    </a>
  </div>
{/if}

