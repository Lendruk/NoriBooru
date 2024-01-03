import { VaultController, type VaultInstance } from "$lib/server/db/VaultController";
import { tags } from "$lib/server/db/vault/schema";
import type { Locals } from "$lib/types/Locals";
import { error, json, type RequestHandler } from "@sveltejs/kit";
import { eq, like } from "drizzle-orm";

export const POST: RequestHandler = async ({request, locals }) => {
  const body = await request.json();
  const vault = (locals as Locals).vault satisfies VaultInstance;
  const { db } = vault;

  const newTag = await db.insert(tags).values({ name: body.name, tagTypeId: body.tagTypeId}).returning();
  return json(newTag[0]);
};

export const GET: RequestHandler = async ({ url, locals }) => {
  const name = url.searchParams.get("name");
  let foundTags = [];
  const vault = (locals as Locals).vault satisfies VaultInstance;
  const { db } = vault;
  if (name) {
    foundTags = await db.query.tags.findMany({ where: like(tags.name, `%${name}%`) });
  } else {
    foundTags = await db.query.tags.findMany({ with: { tagType: true } });
  }  
  return json(foundTags);
};