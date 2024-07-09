import type { Vault } from '$lib/types/Vault';
import { writable } from 'svelte/store';

export const vaultStore = writable<Vault | undefined>();
export const isSdStarting = writable<boolean>(true);

export type SDUIStatus = 'RUNNING' | 'NOT_RUNNING' | 'UNKNOWN'
export const sdUiStatus = writable<SDUIStatus>('UNKNOWN');