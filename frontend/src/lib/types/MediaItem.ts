import type { TagDef } from "./TagDef";

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

export type MediaItemWithTags = BaseMediaItem & { tags: TagDef[] };