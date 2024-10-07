import type { Vault } from '$lib/types/Vault';
import { vaultStore } from '../../store';

export class VaultService {
	public static setVault(vault: Vault): void {
		vaultStore.set(vault);
		localStorage.setItem(
			'currentVault',
			JSON.stringify({
				...vault,
				port: undefined
			})
		);
	}

	public static removeVault(): void {
		vaultStore.set(undefined);
		localStorage.removeItem('currentVault');
	}
}
