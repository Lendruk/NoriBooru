import { masterDb } from "$lib/server/db/master/db";
import { vaults } from "$lib/server/db/master/schema";
import { VaultController, type VaultInstance } from "$lib/server/db/VaultController";
import type { Locals } from "$lib/types/Locals";
import { error, type Handle } from "@sveltejs/kit";
import { eq } from "drizzle-orm";

export const handle: Handle = async ({ event, resolve }) => {
  // Add header logic
	// console.log(event.url.pathname);
	const vaultId = event.request.headers.get("vault");

	// if(!vaultId && VaultManager.vaultEndpoints.has(event.url.pathname)) {
	// 	return error(400, { message: "Vault header is required" });
	// } 
	
	if(vaultId) {
		let vaultInstance: VaultInstance;
		if (!VaultController.vaults.has(vaultId)) {
			const vault = await masterDb.query.vaults.findFirst({ where: eq(vaults.id, vaultId )});
			
			if(!vault) {
				return error(400, { message: "Vault not found" });
			}
			VaultController.registerVault(vault);
		}
		vaultInstance = VaultController.getVault(vaultId);

		(event.locals as Locals).vault = vaultInstance;
	}

	const response = await resolve(event);
	return response;
};