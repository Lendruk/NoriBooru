import { relations, type InferSelectModel } from 'drizzle-orm';
import { integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull()
});

export type User = InferSelectModel<typeof users>;

export const tags = sqliteTable('tags', {
	id: integer('id').primaryKey(),
	name: text('name').notNull(),
	color: text('color').notNull(),
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
	hash: text('hash').notNull(),
	originalFileName: text('original_file_name'),
	source: text('source'),
	sdCheckpoint: text('sd_checkpoint').references(() => sdCheckpoints.id)
});

export const mediaItemsMetadata = sqliteTable('media_items_metadata', {
	id: text('id').primaryKey(),
	mediaItem: integer('media_item').references(() => mediaItems.id, { onDelete: 'cascade' }),
	width: integer('width').notNull(),
	height: integer('height').notNull(),
	// Ai stuff
	positivePrompt: text('positive_prompt'),
	negativePrompt: text('negative_prompt'),
	steps: integer('steps'),
	seed: integer('seed'),
	sampler: text('sampler'),
	model: text('model'),
	upscaler: text('upscaler'),
	upscaleBy: real('upscale_by'),
	cfgScale: integer('cfg_scale'),
	vae: text('vae'),
	loras: text('loras'),
	denoisingStrength: real('denoising_strength')
});
export type MediaItemMetadataSchema = InferSelectModel<typeof mediaItemsMetadata>;

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
			.references(() => tags.id, { onDelete: 'cascade' }),
		mediaItemId: integer('media_item_id')
			.notNull()
			.references(() => mediaItems.id, { onDelete: 'cascade' })
	},
	(t) => ({ pk: primaryKey({ columns: [t.tagId, t.mediaItemId] }) })
);
export type TagsToMediaItemsSchema = InferSelectModel<typeof tagsToMediaItems>;

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

export type PlaylistSchema = InferSelectModel<typeof playlists>;

export const playlists_mediaItems_table = sqliteTable(
	'playlists_media_items',
	{
		playlistId: integer('playlist_id')
			.notNull()
			.references(() => playlists.id, { onDelete: 'cascade' }),
		mediaItemId: integer('media_item_id')
			.notNull()
			.references(() => mediaItems.id, { onDelete: 'cascade' }),
		itemIndex: integer('item_index').notNull()
	},
	(t) => ({ pk: primaryKey({ columns: [t.playlistId, t.mediaItemId] }) })
);

export type MediaItemSchema = InferSelectModel<typeof mediaItems> & {
	tags?: TagSchema[];
};

// Stable Diffusion schemas

export const tagsToLoras = sqliteTable(
	'tags_to_loras',
	{
		tagId: integer('tag_id')
			.notNull()
			.references(() => tags.id, { onDelete: 'cascade' }),
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
	sha256: text('sha256').notNull(),
	previewMediaItem: integer('preview_media_item')
});
export type SDCheckpointSchema = InferSelectModel<typeof sdCheckpoints>;

export const sdLoras = sqliteTable('sd_loras', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	path: text('path').notNull(),
	description: text('description'),
	metadata: text('metadata'),
	origin: text('origin').notNull(),
	sdVersion: text('sd_version').notNull(),
	previewMediaItem: integer('preview_media_item'),
	type: text('type'),
	activationWords: text('activation_words').notNull()
});
export type SDLoraSchema = InferSelectModel<typeof sdLoras>;

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

export const sdWildcards = sqliteTable('sd_wildcards', {
	id: text('id').primaryKey(),
	listName: text('list_name').notNull(),
	values: text('text').notNull()
});
export type SDWildcardSchema = InferSelectModel<typeof sdWildcards>;

export const sdPrompts = sqliteTable('sd_prompts', {
	id: text('id').primaryKey(),
	name: text('name'),
	previewMediaItem: integer('preview_media_item'),
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
	highResDenoisingStrength: real('high_res_denoising_strength'),
	highResUpscaleBy: real('high_res_upscale_by'),
	createdAt: integer('created_at').notNull()
});

export type SDPromptSchema = InferSelectModel<typeof sdPrompts>;

// Watchers

export const activeWatchers = sqliteTable('active_watchers', {
	id: text('id').primaryKey(),
	description: text('description'),
	status: text('status').notNull(),
	data: text('data'),
	itemsPerRequest: integer('items_per_request').notNull().default(0),
	itemsDownloaded: integer('items_downloaded').notNull().default(0),
	totalItems: integer('total_items'),
	type: text('type').notNull(),
	url: text('url').notNull(),
	requestInterval: integer('request_interval').notNull().default(0),
	timeSinceNewItems: integer('time_since_new_items').notNull().default(0),
	lastRequestedAt: integer('last_requested_at').notNull().default(0),
	// How much time it needs to pass without new items for the watcher to be considered dead
	inactivityTimeout: integer('inactivity_timeout').notNull().default(0),
	createdAt: integer('created_at').notNull()
});

export const activeWatchers_to_mediaItems = sqliteTable(
	'active_watchers_to_media_items',
	{
		activeWatcherId: text('active_watcher_id')
			.notNull()
			.references(() => activeWatchers.id, { onDelete: 'cascade' }),
		mediaItemId: integer('media_item_id')
			.notNull()
			.references(() => mediaItems.id, { onDelete: 'cascade' })
	},
	(t) => ({ pk: primaryKey({ columns: [t.activeWatcherId, t.mediaItemId] }) })
);

export const activeWatchers_to_tags = sqliteTable(
	'active_watchers_to_tags',
	{
		activeWatcherId: text('active_watcher_id')
			.notNull()
			.references(() => activeWatchers.id, { onDelete: 'cascade' }),
		tagId: text('tag_id')
			.notNull()
			.references(() => tags.id, { onDelete: 'cascade' })
	},
	(t) => ({ pk: primaryKey({ columns: [t.activeWatcherId, t.tagId] }) })
);

export type ActiveWatcherSchema = InferSelectModel<typeof activeWatchers>;
