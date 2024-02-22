import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { db } from '../../db/vault/db';
import { Tag, mediaItems, tagsToMediaItems } from '../../db/vault/schema';
import { asc, desc, eq } from 'drizzle-orm';

type BaseMediaItem = {
  id: number;
  fileName: string;
  type: string;
  extension: string;
  fileSize: number;
  createdAt: number;
  updatedAt: number | null;
  isArchived: boolean;
}

export type MediaItem = BaseMediaItem & {
  tags: number[];
};


export type MediaItemWithTags = BaseMediaItem & { tags: Tag[] };

const PAGE_SIZE = 30;
type SortMethods = "newest" | "oldest";

const searchMediaItems = async (request: Request, reply: FastifyReply) => {
  const vault = request.vault;
  const query = request.query as { positiveTags: string, negativeTags: string, sortMethod: SortMethods, page: string };

  if(!vault) {
    return reply.status(400).send('No vault provided');
  }

  const positiveTags = JSON.parse(query.positiveTags) as number[] ?? [];
  const negativeTags = JSON.parse(query.negativeTags) as number[] ?? [];
  const sortMethod: SortMethods = query.sortMethod ?? "newest";
  let hasFilters = positiveTags.length > 0 || negativeTags.length > 0;
  const page = parseInt(query.page ?? "0");
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

  return reply.send({ mediaItems: filteredMediaItems });
};

export default {
	method: 'GET',
	url: '/mediaItems',
	handler: searchMediaItems,
} as RouteOptions;