import type { VaultInstance } from "$lib/server/db/VaultController";
import { mediaItems, tagsToMediaItems } from "$lib/server/db/vault/schema";
import type { Locals } from "$lib/types/Locals";
import type { MediaItem } from "$lib/types/MediaItem";
import { json, type RequestHandler } from "@sveltejs/kit";
import { asc, desc, eq } from "drizzle-orm";

const PAGE_SIZE = 30;
type SortMethods = "newest" | "oldest";

export const GET: RequestHandler = async ({url, locals}) => {
  const vault = (locals as Locals).vault satisfies VaultInstance;
  const { db } = vault;

  const positiveTags = JSON.parse(url.searchParams.get("positiveTags")!) as number[] ?? [];
  const negativeTags = JSON.parse(url.searchParams.get("negativeTags")!) as number[] ?? [];
  const sortMethod: SortMethods = url.searchParams.get("sortMethod") as SortMethods ?? "newest";
  let hasFilters = positiveTags.length > 0 || negativeTags.length > 0;
  const page = parseInt(url.searchParams.get("page") ?? "0");
  const rows = await db.select().from(mediaItems)
  .orderBy(sortMethod === "newest" ? desc(mediaItems.createdAt) : asc(mediaItems.createdAt))
  .leftJoin(tagsToMediaItems, eq(tagsToMediaItems.mediaItemId, mediaItems.id))
  .limit(PAGE_SIZE)
  .offset(page * PAGE_SIZE);

  let filteredMediaItems = Object.values(rows.reduce<Record<number, MediaItem>>((acc, row) => {
    const mediaItem = row.media_items;
    const tag = row.tags_to_media_items;

    if(!acc[mediaItem.id]) {
      acc[mediaItem.id] = {
        ...mediaItem,
        isArchived: mediaItem.isArchived === 1,
        tags: [],
      };
    }

    if (tag) {
      acc[mediaItem.id].tags.push(tag.tagId);
    }

    if ((!tag && hasFilters)) {
      // Delete
      delete acc[mediaItem.id];
    }
    return acc;
  }, {})).sort((a, b) => sortMethod === "newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt);

  if (hasFilters) {
    filteredMediaItems = filteredMediaItems.filter(item => positiveTags.every(tag => item.tags.includes(tag)) && negativeTags.every(tag => !item.tags.includes(tag)));
  }

  return json({ status: 200, mediaItems: filteredMediaItems });
};