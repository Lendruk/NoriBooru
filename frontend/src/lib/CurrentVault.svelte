<script lang="ts">
	import DoorOpen from "./icons/DoorOpen.svelte";
	import type { Vault } from "./types/Vault";

  let currentVault: Vault | null = null;

  if (typeof localStorage !== 'undefined') {
    let storageVault = localStorage?.getItem("currentVault");
    currentVault = storageVault ? JSON.parse(storageVault) : null;
  }
</script>

<div class="mr-4 flex items-center">
  Vault: {currentVault?.name}
  <a href="/vaults" class="ml-2">
    <DoorOpen />
  </a>
</div>