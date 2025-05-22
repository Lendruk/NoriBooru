import { Version } from '../lib/VaultMigrator';

export type VaultConfig = {
	version: Version;
	id: string;
	name: string;
	path: string;
	createdAt: number;
	civitaiApiKey: string | null;
};
