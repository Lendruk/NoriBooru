import type { World } from './Worldbuilding/World';

export type Vault = {
	id: string;
	name: string;
	path: string;
	port?: number;
	civitaiApiKey: string | null;
	world?: World;
};
