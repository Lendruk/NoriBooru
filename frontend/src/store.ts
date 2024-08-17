import type { RunningJob } from '$lib/types/RunningJob';
import type { Vault } from '$lib/types/Vault';
import { writable } from 'svelte/store';

export const vaultStore = writable<Vault | undefined>();
export const isSdStarting = writable<boolean>(true);
export const isSdStopping = writable<boolean>(false);

export type SDUIStatus = 'RUNNING' | 'NOT_RUNNING' | 'UNKNOWN';
export const sdUiStatus = writable<SDUIStatus>('UNKNOWN');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const runningJobs = writable<RunningJob<any>[]>([]);
