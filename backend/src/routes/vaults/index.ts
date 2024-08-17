import checkVaultPath from './checkVaultPath';
import createVault from './createVault';
import deleteVault from './deleteVault';
import getVaults from './getVaults';
import importVault from './importVault';
import renameVault from './renameVault';
import unlinkVault from './unlinkVault';
export default [
	createVault,
	getVaults,
	checkVaultPath,
	renameVault,
	deleteVault,
	importVault,
	unlinkVault
];
