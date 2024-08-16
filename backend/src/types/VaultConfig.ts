export type VaultConfig = {
	id: string;
	name: string;
	path: string;
	createdAt: number;
	hasInstalledSD: boolean;
	civitaiApiKey: string | null;
};
