import type { VaultInstance } from "$lib/server/db/VaultController";
import { mediaItems, tags, tagsToMediaItems, type Tag } from "$lib/server/db/vault/schema";
import type { Locals } from "$lib/types/Locals";
import { json, type RequestHandler } from "@sveltejs/kit";
import { eq, gt, lt } from "drizzle-orm";
import fs from 'fs/promises';
import path from 'path';

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const vaultInstance = (locals as Locals).vault satisfies VaultInstance;
  const { db, vault } = vaultInstance;

  const { id } = params;
  const parsedId = Number.parseInt(id ?? "");

  try {
    if (parsedId) {
      const mediaItem = await db.query.mediaItems.findFirst({ where: eq(mediaItems.id, parsedId) });
      if(mediaItem) {
        const mediaTags = await db.query.tagsToMediaItems.findMany({ where: eq(tagsToMediaItems.mediaItemId, parsedId) });
        for(const mediaTag of mediaTags) {
          const tag = await db.query.tags.findFirst({ where: eq(tags.id, mediaTag.tagId) });
          console.log(tag);
          await db.update(tags).set({ mediaCount: tag!.mediaCount - 1 }).where(eq(tags.id, tag!.id));
        }
        await db.delete(tagsToMediaItems).where(eq(tagsToMediaItems.mediaItemId, parsedId));
        await db.delete(mediaItems).where(eq(mediaItems.id, parsedId));
        // Delete the file
        try {
          await fs.unlink(path.join(vault.path, "media", mediaItem.type + 's', `${mediaItem.fileName}.${mediaItem.extension}`));
        } catch (error) {
          // TODO - Add fall back for error in file deletion
        }
      }
    }
  } catch(error) {
    console.log(error);
    return json({ status: 400, message: error });
  }

  return json({ status: 200})
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  const vaultInstance = (locals as Locals).vault satisfies VaultInstance;
  const { db } = vaultInstance;
  const { id } = params;
  const parsedId = Number.parseInt(id ?? "");
  const body = await request.json() as { isArchived: boolean };
  try {
    await db.update(mediaItems).set({ isArchived: body.isArchived ? 1 : 0 }).where(eq(mediaItems.id, parsedId));
  } catch(error) {
    console.log(error);
    return json({ status: 400, message: error });
  }

  return json({ status: 200});
};

export const GET: RequestHandler = async ({ params, locals }) => {
  const vaultInstance = (locals as Locals).vault satisfies VaultInstance;
  const { db } = vaultInstance;
  const { id } = params as { id: string };
  const parsedId = Number.parseInt(id);
  const mediaItem = await db.query.mediaItems.findFirst({ where: eq(mediaItems.id, parsedId), with: { tagsToMediaItems: true }});
  const mediaTags = await db.query.tagsToMediaItems.findMany({ where: eq(tagsToMediaItems.mediaItemId, parsedId) });
  const allTags = await db.query.tags.findMany({ with: { tagType: true }}) as Tag[];
  let finalTags = [];
  const nextMediaItem = await db.query.mediaItems.findFirst({ where: gt(mediaItems.id, parsedId) });
  const previousMediaItem = await db.query.mediaItems.findFirst({ where: lt(mediaItems.id, parsedId), orderBy: (tb, { desc }) => [desc(tb.id)],});

  for (const mediaTag of mediaTags) {
    const tag = await db.query.tags.findFirst({ where: eq(tags.id, mediaTag.tagId), with: { tagType: true }  });
    finalTags.push(tag);
  }

  return json({mediaItem: { ...mediaItem, tags: finalTags as Tag[] }, next: nextMediaItem?.id, previous: previousMediaItem?.id, tags: allTags });
};