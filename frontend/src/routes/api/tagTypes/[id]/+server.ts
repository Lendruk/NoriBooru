import { VaultController, type VaultInstance } from "$lib/server/db/VaultController";
import { tagTypes } from "$lib/server/db/vault/schema";
import type { Locals } from "$lib/types/Locals";
import { error, json, type RequestHandler } from "@sveltejs/kit";
import { eq } from "drizzle-orm";

export const DELETE: RequestHandler = async ({params, locals }) => {
  const vault = (locals as Locals).vault satisfies VaultInstance;
  const { db } = vault;

  await db.delete(tagTypes).where(eq(tagTypes.id, Number.parseInt(params.id ?? "")));
  return json({}, { status: 200 });
}