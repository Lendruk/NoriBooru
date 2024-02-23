import type { TagType } from "./TagType";

export type TagDef = {
  id: number;
  name: string;
  mediaCount: number;
  tagTypeId: number;
  tagType: TagType;
}