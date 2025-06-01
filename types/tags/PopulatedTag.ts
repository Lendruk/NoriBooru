import { TagSchema } from "../../backend/src/db/vault/schema";

export type SimpleTag = Omit<TagSchema, "parentTagId">;
export type PopulatedTag = SimpleTag & {
  parent: SimpleTag | null;
  subTags: PopulatedTag[];
};
