import type { VaultInstance } from "$lib/server/db/VaultController";
import { playlists, playlists_mediaItems_table } from "$lib/server/db/vault/schema";
import type { Locals } from "$lib/types/Locals";
import { json, type RequestHandler } from "@sveltejs/kit";
import { eq, sql } from "drizzle-orm";

type RequestBody = {
  name: string,
  randomizeOrder: boolean,
  items: number[]
};

export type SimplePlaylist = {
  id: number;
  name: string;
  createdAt: number;
  updatedAt: number | null;
  randomizeOrder: number;
  timePerItem: number | null;
  items: number;
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const vaultInstance = (locals as Locals).vault satisfies VaultInstance;
  const { db } = vaultInstance;

  const body = await request.json() as RequestBody;
  console.log(body);
  const playlist = (await db.insert(playlists).values({ name: body.name, createdAt: Date.now(), randomizeOrder: body.randomizeOrder ? 1 : 0 }).returning())[0];

  let items: { playlistId: number; mediaItemId: number; itemIndex: number }[] = [];
  if (body.items.length > 0) {
    items = await db.insert(playlists_mediaItems_table).values(body.items.map((item, index) => ({ playlistId: playlist.id, mediaItemId: item, itemIndex: index }))).returning();
  }

  return json({ ...playlist, items });
};

export const GET: RequestHandler = async ({ params, locals }) => {
  const vaultInstance = (locals as Locals).vault satisfies VaultInstance;
  const { db } = vaultInstance;
  const playlists = await db.query.playlists.findMany() as SimplePlaylist[];

  for(const playlist of playlists) {
    const amtOfMedia = await db.select({ count: sql<number>`cast(count(${playlists_mediaItems_table.playlistId}) as int)` }).from(playlists_mediaItems_table)
    .where(eq(playlists_mediaItems_table.playlistId, playlist.id));
    playlist.items = amtOfMedia[0].count;
  }

  return json(playlists);
};