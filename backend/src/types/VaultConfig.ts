export type VaultConfig = {
	version: string;
	id: string;
	name: string;
	path: string;
	createdAt: number;
	hasInstalledSD: boolean;
	civitaiApiKey: string | null;
};
