import { writable } from 'svelte/store';
import type { Vault } from '$lib/types/Vault';

export const vaultStore = writable<Vault | undefined>();
