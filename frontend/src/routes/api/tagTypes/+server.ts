import { VaultController, type VaultInstance } from "$lib/server/db/VaultController";
import { tagTypes } from "$lib/server/db/vault/schema";
import type { Locals } from "$lib/types/Locals";
import { error, json, type RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({request, locals}) => {
  const body = await request.json();
  const vault = (locals as Locals).vault satisfies VaultInstance;
  const { db } = vault;

  const newTagType = await db.insert(tagTypes).values({ name: body.name, color: body.color}).returning();
  return json(newTagType[0]);
};

export const GET: RequestHandler = async ({ locals }) => {
  const vault = (locals as Locals).vault satisfies VaultInstance;
  const { db } = vault;

  const tagTypes = await db.query.tagTypes.findMany();
  return json(tagTypes);
};