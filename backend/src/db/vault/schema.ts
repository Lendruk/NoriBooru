import { relations, type InferSelectModel } from 'drizzle-orm';
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull()
});

export type User = InferSelectModel<typeof users>;

export const tags = sqliteTable('tags', {
	id: integer('id').primaryKey(),
	name: text('name').notNull(),
	color: text('color').notNull(),
	mediaCount: integer('media_count').notNull().default(0),
	parentTagId: integer('parent_id')
});
export type TagSchema = InferSelectModel<typeof tags>;

export const mediaItems = sqliteTable('media_items', {
	id: integer('id').primaryKey(),
	fileName: text('file_name').notNull(),
	type: text('type').notNull(),
	extension: text('extension').notNull(),
	fileSize: integer('file_size').notNull(),
	createdAt: integer('created_at').notNull(),
	updatedAt: integer('updated_at'),
	isArchived: integer('is_archived').notNull().default(0),
	exif: text('exif'),
	sdCheckpoint: text('sd_checkpoint').references(() => sdCheckpoints.id)
});

export const tags_mediaItems_relation = relations(mediaItems, ({ many }) => ({
	tagsToMediaItems: many(tagsToMediaItems)
}));

export const mediaItems_tags_relation = relations(tags, ({ many }) => ({
	tagsToMediaItems: many(tagsToMediaItems)
}));

export const tagsToMediaItems = sqliteTable(
	'tags_to_media_items',
	{
		tagId: integer('tag_id')
			.notNull()
			.references(() => tags.id),
		mediaItemId: integer('media_item_id')
			.notNull()
			.references(() => mediaItems.id)
	},
	(t) => ({ pk: primaryKey({ columns: [t.tagId, t.mediaItemId] }) })
);

export const tagsToMediaItemsRelation = relations(tagsToMediaItems, ({ one }) => ({
	tag: one(tags, {
		fields: [tagsToMediaItems.tagId],
		references: [tags.id]
	}),
	mediaItem: one(mediaItems, {
		fields: [tagsToMediaItems.mediaItemId],
		references: [mediaItems.id]
	})
}));

export const playlists = sqliteTable('playlists', {
	id: integer('id').primaryKey(),
	name: text('name').notNull(),
	createdAt: integer('created_at').notNull(),
	randomizeOrder: integer('randomize_order').notNull().default(0),
	timePerItem: integer('time_per_item').default(0),
	updatedAt: integer('updated_at')
});

export type Playlist = InferSelectModel<typeof playlists> & {
	items: MediaItem[];
};

export const playlists_mediaItems_table = sqliteTable(
	'playlists_media_items',
	{
		playlistId: integer('playlist_id')
			.notNull()
			.references(() => playlists.id),
		mediaItemId: integer('media_item_id')
			.notNull()
			.references(() => mediaItems.id, { onDelete: 'cascade' }),
		itemIndex: integer('item_index').notNull()
	},
	(t) => ({ pk: primaryKey({ columns: [t.playlistId, t.mediaItemId] }) })
);

export type MediaItem = InferSelectModel<typeof mediaItems> & {
	tags?: TagSchema[];
};

// Stable Diffusion schemas

export const sdPrompts = sqliteTable('sd_prompts', {
	id: text('id').primaryKey(),
	name: text('name'),
	previewImage: text('preview_image'),
	positivePrompt: text('positive_prompt').notNull(),
	negativePrompt: text('negative_prompt').notNull(),
	sampler: text('sampler').notNull(),
	steps: integer('steps').notNull(),
	width: integer('width').notNull(),
	height: integer('height').notNull(),
	checkpoint: text('checkpoint').notNull(),
	cfgScale: integer('cfg_scale').notNull(),
	isHighResEnabled: integer('is_high_res_enabled').notNull(),
	highResUpscaler: text('high_res_upscaler'),
	highResSteps: integer('high_res_steps'),
	highResDenoisingStrength: integer('high_res_denoising_strength'),
	highResUpscaleBy: integer('high_res_upscale_by'),
	createdAt: integer('created_at').notNull()
});

export const lorasToMediaItems = sqliteTable(
	'loras_to_mediaItems',
	{
		mediaItemId: integer('media_item_id')
			.notNull()
			.references(() => mediaItems.id, { onDelete: 'cascade' }),
		loraId: text('lora_id')
			.notNull()
			.references(() => sdLoras.id, { onDelete: 'cascade' })
	},
	(t) => ({ pk: primaryKey({ columns: [t.mediaItemId, t.loraId] }) })
);

export const tagsToLoras = sqliteTable(
	'tags_to_loras',
	{
		tagId: integer('tag_id')
			.notNull()
			.references(() => tags.id, { onDelete: 'cascade'}),
		loraId: text('lora_id')
			.notNull()
			.references(() => sdLoras.id, { onDelete: 'cascade' })
	},
	(t) => ({ pk: primaryKey({ columns: [t.tagId, t.loraId] }) })
);

export const sdCheckpoints = sqliteTable('sd_checkpoints', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	path: text('path').notNull(),
	description: text('description'),
	origin: text('origin').notNull(),
	sdVersion: text('sd_version').notNull(),
	previewImage: text('preview_image')
});
export type SDCheckpointSchema = InferSelectModel<typeof sdCheckpoints>;

export const sdLoras = sqliteTable('sd_loras', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	path: text('path').notNull(),
	description: text('description'),
	metadata: text('metadata'),
	previewImage: text('preview_image'),
	origin: text('origin').notNull(),
	sdVersion: text('sd_version').notNull(),
	activationWords: text('activation_words').notNull()
});
export type SDLoraSchema = InferSelectModel<typeof sdLoras>;

export const sdWildcards = sqliteTable('sd_wildcards', {
	id: text('id').primaryKey(),
	listName: text('list_name').notNull(),
	values: text('text').notNull(),
});
export type SDWildcardSchema = InferSelectModel<typeof sdWildcards>;
