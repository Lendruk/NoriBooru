import { relations, type InferSelectModel } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
});

export type User = InferSelectModel<typeof users>;

export const tagTypes = sqliteTable("tag_types", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
})
export type TagType = InferSelectModel<typeof tagTypes>;

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  mediaCount: integer("media_count").notNull().default(0),
  tagTypeId: integer("tag_type_id").references(() => tagTypes.id),
});
export type Tag = InferSelectModel<typeof tags> & { tagType?: TagType};

export const tagsRelations = relations(tags, ({ one }) => ({
  tagType: one(tagTypes, {
    fields: [tags.tagTypeId],
    references: [tagTypes.id]
  })
}));

export const mediaItems = sqliteTable("media_items", {
  id: integer("id").primaryKey(),
  fileName: text("file_name").notNull(),
  type: text("type").notNull(),
  extension: text("extension").notNull(),
  fileSize: integer("file_size").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at"),
  isArchived: integer("is_archived").notNull().default(0),
});

export const tags_mediaItems_relation = relations(mediaItems, ({ many }) => ({
  tagsToMediaItems: many(tagsToMediaItems)
}));

export const mediaItems_tags_relation = relations(tags, ({ many }) => ({
  tagsToMediaItems: many(tagsToMediaItems)
}));

export const tagsToMediaItems = sqliteTable("tags_to_media_items", {
  tagId: integer("tag_id").notNull().references(() => tags.id),
  mediaItemId: integer("media_item_id").notNull().references(() => mediaItems.id),
}, (t) => ({ pk: primaryKey({ columns: [t.tagId, t.mediaItemId]})}));

export const tagsToMediaItemsRelation = relations(tagsToMediaItems, ({ one }) => ({
	tag: one(tags, {
		fields: [tagsToMediaItems.tagId],
		references: [tags.id],
	}),
	mediaItem: one(mediaItems, {
		fields: [tagsToMediaItems.mediaItemId],
		references: [mediaItems.id],
	}),
}));

export const playlists = sqliteTable("playlists", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("created_at").notNull(),
  randomizeOrder: integer("randomize_order").notNull().default(0),
  timePerItem: integer("time_per_item").default(0),
  updatedAt: integer("updated_at"),
});

export type Playlist = InferSelectModel<typeof playlists> & { items: MediaItem[] };

export const playlists_mediaItems_table = sqliteTable("playlists_media_items", {
  playlistId: integer("playlist_id").notNull().references(() => playlists.id),
  mediaItemId: integer("media_item_id").notNull().references(() => mediaItems.id, { onDelete: 'cascade'}),
  itemIndex: integer("item_index").notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.playlistId, t.mediaItemId]})}));

export type MediaItem = InferSelectModel<typeof mediaItems> & { tags?: Tag[] };