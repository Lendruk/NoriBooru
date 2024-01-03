<script lang="ts">
	import { goto } from '$app/navigation';
	import PlayIcon from '$lib/client/icons/PlayIcon.svelte';
  import type { Vault } from '$lib/server/db/master/schema';
	import { onMount } from 'svelte';
  import type { PageData } from './$types';
	export let data: PageData;
  let showCreateMenu = false;

  let newVaultName = "";
  let newVaultPath = "";

  onMount(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem("currentVault");
    }
  });

  async function createVault() {
    if (!newVaultName || !newVaultPath) {
      return;
    }

    const res = await fetch("/api/vaults", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: newVaultName,
        path: newVaultPath,
      }),
    });

    if (res.ok) {
      const vault = await res.json() as Vault;
      console.log(vault);
    } else {
      console.error("Failed to create vault");
    }
  }

  function publishVaultToLocalStorage(vault: Vault) {
    localStorage.setItem("currentVault", JSON.stringify(vault));
    goto("/");
  }
</script>

<div class="flex flex-col flex-1 items-center mt-28">
  <h1 class="text-3xl mb-5">
    Enter vault
  </h1>
  <div class="bg-slate-800 rounded-sm min-w-[33%]">
    <div class="flex flex-col p-4">
        {#if data.vaults.length > 0}
          {#each data.vaults as vault}
            <div class="p-2 flex flex-1 flex-row items-center justify-between hover:transition-all hover:bg-slate-950">
              {vault.name}
              <button on:click={() => publishVaultToLocalStorage(vault)}><PlayIcon /></button>
            </div>
          {/each}
        {:else}
          <div>No vaults</div>
        {/if}
    </div>
    <button class="border-t-2 flex flex-1 w-full pl-4 pb-4 pt-4" on:click={() => showCreateMenu = true }>Create Vault</button>
  </div>
  <div class={`flex flex-col ${showCreateMenu ? 'flex' : 'hidden'}`}>
    <input bind:value={newVaultName} name="vaultName" type="text" placeholder="Vault name" />
    <input bind:value={newVaultPath} name="vaultPath" type="text" placeholder="Path" />
    <button onclick={createVault}>Create</button>
  </div>
</div>