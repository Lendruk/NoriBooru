import type { World } from './Worldbuilding/World';

export type Vault = {
	id: string;
	name: string;
	path: string;
	port?: number;
	hasInstalledSD: boolean;
	civitaiApiKey: string | null;
	world?: World;
};
