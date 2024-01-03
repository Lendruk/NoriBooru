import { VaultController, type VaultInstance } from "$lib/server/db/VaultController";
import { tags, tagTypes } from "$lib/server/db/vault/schema";
import type { Locals } from "$lib/types/Locals";
import { error, json, type RequestHandler } from "@sveltejs/kit";
import { eq } from "drizzle-orm";

export const DELETE: RequestHandler = async ({params, locals }) => {
  const vault = (locals as Locals).vault satisfies VaultInstance;
  const { db } = vault;

  await db.delete(tags).where(eq(tags.id, Number.parseInt(params.id ?? "")));
  return json({}, { status: 200 });
}

export const PUT: RequestHandler = async ({params, request, locals}) => {
  const tagId = params.id;
  const body = await request.json();
  const vault = (locals as Locals).vault satisfies VaultInstance;
  const { db } = vault;

  const updated = await db.update(tags)
  .set({ name: body.name, tagTypeId: body.tagTypeId})
  .where(eq(tags.id, Number.parseInt(tagId ?? ""))).returning();

  const tagType = await db.query.tagTypes.findFirst({ where: eq(tagTypes.id, body.tagTypeId ) });
  return json({ ...updated[0], tagType: tagType });
};