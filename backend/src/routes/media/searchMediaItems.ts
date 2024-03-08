import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { Tag, mediaItems, tags, tagsToMediaItems } from '../../db/vault/schema';
import { asc, desc, eq } from 'drizzle-orm';
import { checkVault } from '../../hooks/checkVault';

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

export type MediaSearchQuery = { positiveTags: string, negativeTags: string, sortMethod: SortMethods, page: string, archived: string };

const PAGE_SIZE = 30;
type SortMethods = "newest" | "oldest";

const searchMediaItems = async (request: Request, reply: FastifyReply) => {
  const vaultInstance = request.vault;
  const query = request.query as MediaSearchQuery;

  if(!vaultInstance) {
    return reply.status(400).send('No vault provided');
  }

  const { db } = vaultInstance;
  const positiveTags = JSON.parse(query.positiveTags ?? '[]') as number[];
  const negativeTags = JSON.parse(query.negativeTags ?? '[]') as number[];
  const sortMethod: SortMethods = query.sortMethod ?? "newest";
  let hasFilters = positiveTags.length > 0 || negativeTags.length > 0;
  const page = parseInt(query.page ?? "0");
  const rows = await db.select().from(mediaItems)
  .where(eq(mediaItems.isArchived, query.archived === 'true' ? 1 : 0))
  .orderBy(sortMethod === "newest" ? desc(mediaItems.createdAt) : asc(mediaItems.createdAt));

  let finalMedia: MediaItem[] = [];
  for(const row of rows) {
    let tagArr: number[] = [];
    const tagPairs = await db.select().from(tagsToMediaItems).where(eq(tagsToMediaItems.mediaItemId, row.id));

    for(const tagPair of tagPairs) {
      tagArr.push(tagPair.tagId);
    }

    finalMedia.push({
      createdAt: row.createdAt,
      extension: row.extension,
      fileName: row.fileName,
      fileSize: row.fileSize,
      id: row.id,
      isArchived: row.isArchived === 1 ? true : false,
      type: row.type,
      updatedAt: row.updatedAt,
      tags: tagArr,
    });
  }

  finalMedia = finalMedia.sort((a, b) => sortMethod === "newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt);
  if (hasFilters) {
    finalMedia = finalMedia.filter(item => positiveTags.every(tag => item.tags.includes(tag)) && negativeTags.every(tag => !item.tags.includes(tag)));
  }

  return reply.send({ mediaItems: finalMedia.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE) });
};

export default {
	method: 'GET',
	url: '/mediaItems',
	handler: searchMediaItems,
  onRequest: checkVault,
} as RouteOptions;