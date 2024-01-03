import type { VaultInstance } from "$lib/server/db/VaultController";
import { tagsToMediaItems, type Tag, tags } from "$lib/server/db/vault/schema";
import type { Locals } from "$lib/types/Locals";
import { json, type RequestHandler } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";

export const PUT: RequestHandler = async ({request, params, locals }) => {
  const vaultInstance = (locals as Locals).vault satisfies VaultInstance;
  const { db } = vaultInstance;

  const { id } = params;
  const body = await request.json() as Tag;
  
  try {
    if (id) {
      await db.insert(tagsToMediaItems).values({ tagId: body.id, mediaItemId: Number.parseInt(id) });
      await db.update(tags).set({ mediaCount: body.mediaCount + 1 }).where(eq(tags.id, body.id));
    }
  } catch(error) {
    return json({ status: 400, message: error });
  }
  return json({ status: 200 });
};

export const DELETE: RequestHandler = async ({request, params, locals }) => {
  const { id } = params;
  const vaultInstance = (locals as Locals).vault satisfies VaultInstance;
  const { db } = vaultInstance;
  const body = await request.json() as Tag;

  try {
    if (id) {
      await db.delete(tagsToMediaItems).where(and(eq(tagsToMediaItems.tagId, body.id), eq(tagsToMediaItems.mediaItemId, Number.parseInt(id))));
      await db.update(tags).set({ mediaCount: body.mediaCount - 1 }).where(eq(tags.id, body.id));
    }
  } catch(error) {
    return json({ status: 400, message: error });
  }
  return json({ status: 200 });
};