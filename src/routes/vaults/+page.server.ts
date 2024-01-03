import { masterDb } from "$lib/server/db/master/db";

export const load = async () => {
 const vaults = await masterDb.query.vaults.findMany();

 return { vaults };
};

export const actions = {
  selectVault: async ({ cookies, request }) => {
    const form = await request.formData();
    const vaultId = form.get("vaultId") as string;
    cookies.set("vault", vaultId, { path: "/" });
  }
}