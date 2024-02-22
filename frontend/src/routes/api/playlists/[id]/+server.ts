import type { VaultInstance } from "$lib/server/db/VaultController";
import { mediaItems, playlists, playlists_mediaItems_table, type Playlist } from "$lib/server/db/vault/schema";
import type { Locals } from "$lib/types/Locals";
import { json, type RequestHandler } from "@sveltejs/kit";
import { eq } from "drizzle-orm";

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const vaultInstance = (locals as Locals).vault satisfies VaultInstance;
  const { db } = vaultInstance;

  if(!params.id) {
    return json({ status: 400, message: "Missing id" });
  
  }
  const id = parseInt(params.id);
  await db.delete(playlists_mediaItems_table).where(eq(playlists_mediaItems_table.playlistId, id));
  await db.delete(playlists).where(eq(playlists.id, id));
  return json({ status: 200 });
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
  const vaultInstance = (locals as Locals).vault satisfies VaultInstance;
  const { db } = vaultInstance;
  const body = await request.json() as { name: string, randomizeOrder: boolean, timePerItem: number, items: number[] };
  if(!params.id) {
    throw new Error("Missing id");
  }

  const id = parseInt(params.id);

  // This is inefficient improve in future
  await db.delete(playlists_mediaItems_table).where(eq(playlists_mediaItems_table.playlistId, id));
  await db.update(playlists).set({ name: body.name, randomizeOrder: body.randomizeOrder ? 1 : 0, timePerItem: body.timePerItem }).where(eq(playlists.id, id));
  await db.insert(playlists_mediaItems_table).values(body.items.map((item, index) => ({ playlistId: id, mediaItemId: item, itemIndex: index }))).returning();
  return json({ status: 200 });
};

export const GET: RequestHandler = async ({ params, locals }) => {
  const vaultInstance = (locals as Locals).vault satisfies VaultInstance;
  const id = parseInt(params.id ?? '');
  const { db } = vaultInstance;

  const rows = await db.select({
    id: playlists.id,
    name: playlists.name,
    createdAt: playlists.createdAt,
    timePerItem: playlists.timePerItem,
    randomizeOrder: playlists.randomizeOrder,
    updatedAt: playlists.updatedAt,
    item: {
      id: mediaItems.id,
      fileName: mediaItems.fileName,
      type: mediaItems.type,
      extension: mediaItems.extension,
      fileSize: mediaItems.fileSize,
      createdAt: mediaItems.createdAt,
      updatedAt: mediaItems.updatedAt,
      isArchived: mediaItems.isArchived,
      index: playlists_mediaItems_table.itemIndex,
    }
  })
  .from(playlists)
  .where(eq(playlists.id, id))
  .leftJoin(playlists_mediaItems_table, eq(playlists_mediaItems_table.playlistId, playlists.id))
  .leftJoin(mediaItems, eq(playlists_mediaItems_table.mediaItemId, mediaItems.id));
  
  const playlist = Object.values(rows.reduce<Record<number, Playlist>>((acc, row) => { 
    const { createdAt, id, name, randomizeOrder, updatedAt, timePerItem, item} = row;

    if(!acc[id]) {
      acc[id] = {
        createdAt,
        id,
        timePerItem,
        name,
        randomizeOrder,
        updatedAt,
        items: [],
      };
    }

    if(item) {
      acc[id].items![item.index!] = { 
        createdAt: item.createdAt!, 
        extension: item.extension!, 
        fileSize: item.fileSize!, 
        fileName: item.fileName!, 
        id: item.id!, 
        isArchived: item.isArchived ?? 0, 
        type: item.type!, 
        updatedAt: item.updatedAt
      };
    }

    return acc;
  }, {}))[0];

  return json(playlist);
};