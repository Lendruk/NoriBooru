import { mediaItems, tagsToMediaItems, type Tag } from "$lib/server/db/vault/schema";
import { json, type RequestHandler } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { v4 as uuidV4 } from 'uuid';
import { tags as tagsTable } from "$lib/server/db/vault/schema";
import fs from 'fs/promises';
import path from 'path';
import type { Locals } from "$lib/types/Locals";
import type { VaultInstance } from "$lib/server/db/VaultController";

export const POST: RequestHandler = async ({request, locals }) => {
  const vaultInstance = (locals as Locals).vault satisfies VaultInstance;
  const { vault, db } = vaultInstance;

  const body = await request.json();
  const imageBase64 = body.image;
  const tags: Tag[] = body.tags;

  const id = uuidV4();
  const imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
  await fs.writeFile(path.join(vault.path, "media", 'images', `${id}.png`), imageBuffer);
  // TODO - Use fs.stat instead
  const fileSize = imageBuffer.byteLength;
  console.log(id);
  const mediaItem = await db.insert(mediaItems).values({  fileName: id, extension: "png", type: "image", fileSize, createdAt: Date.now() }).returning();

  if(tags && tags.length > 0) {
    await db.insert(tagsToMediaItems).values(tags.map(tag => ({ tagId: tag.id, mediaItemId: mediaItem[0].id }))).returning();
    for(const tag of tags) {
      await db.update(tagsTable).set({ mediaCount: tag.mediaCount + 1 }).where(eq(tagsTable.id, tag.id));
    }
  }

  return json({ status: 200, message: "Image registered", id });
}