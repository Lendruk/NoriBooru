import { InferSelectModel } from 'drizzle-orm';
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { mediaItems, tags } from './schema';

// World building
export const world = sqliteTable('world', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	createdAt: integer('created_at').notNull(),
	updatedAt: integer('updated_at').notNull()
});

export type WorldSchema = InferSelectModel<typeof world>;

// Base Tables
export const worldArticles = sqliteTable('world_articles', {
	id: text('id').primaryKey(),
	content: text('content').notNull(),
	createdAt: integer('created_at').notNull(),
	updatedAt: integer('updated_at').notNull()
});

export type WorldArticleSchema = InferSelectModel<typeof worldArticles>;

export const worldSpecies = sqliteTable('world_species', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	createdAt: integer('created_at').notNull(),
	updatedAt: integer('updated_at').notNull()
});

export type WorldSpecieSchema = InferSelectModel<typeof worldSpecies>;

export const worldCultures = sqliteTable('world_cultures', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	createdAt: integer('created_at').notNull(),
	updatedAt: integer('updated_at').notNull()
});

export type WorldCultureSchema = InferSelectModel<typeof worldCultures>;

export const worldCharacters = sqliteTable('world_characters', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	age: integer('age').notNull(),
	createdAt: integer('created_at').notNull(),
	updatedAt: integer('updated_at').notNull(),
	specieId: text('specie_id').references(() => worldSpecies.id, { onDelete: 'set null' }),
	cultureId: text('culture_id').references(() => worldCultures.id, { onDelete: 'set null' })
});

export type WorldCharacterSchema = InferSelectModel<typeof worldCharacters>;

export const worldItems = sqliteTable('world_items', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	createdAt: integer('created_at').notNull(),
	updatedAt: integer('updated_at').notNull()
});

export type WorldItemSchema = InferSelectModel<typeof worldItems>;

export const worldCurrencies = sqliteTable('world_currencies', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	weight: integer('weight').notNull(),
	description: text('description'),
	createdAt: integer('created_at').notNull(),
	updatedAt: integer('updated_at').notNull()
});

export type WorldCurrencySchema = InferSelectModel<typeof worldCurrencies>;

export const worldMaps = sqliteTable('world_maps', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	createdAt: integer('created_at').notNull(),
	updatedAt: integer('updated_at').notNull()
});

export type WorldMapSchema = InferSelectModel<typeof worldMaps>;

export const worldLocations = sqliteTable('world_locations', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	locationType: text('location_type').notNull(),
	sourceId: text('source_id'),
	createdAt: integer('created_at').notNull(),
	updatedAt: integer('updated_at').notNull()
});

export type WorldLocationSchema = InferSelectModel<typeof worldLocations>;

export const mapLayers = sqliteTable('map_layers', {
	id: text('id').primaryKey(),
	name: text('string'),
	mapId: text('id').references(() => worldMaps.id, { onDelete: 'cascade' })
});

export type MapLayerSchema = InferSelectModel<typeof mapLayers>;

// Relation tables
export const worldLocations_to_worldMaps = sqliteTable('worldLocations_to_worldMaps', {
	locationId: text('location_id')
		.notNull()
		.references(() => worldLocations.id, { onDelete: 'cascade' }),
	mapId: text('map_id')
		.notNull()
		.references(() => worldMaps.id, { onDelete: 'cascade' }),
	mapLayer: text('map_layer')
		.notNull()
		.references(() => mapLayers.id, { onDelete: 'cascade' }),
	x: integer('x').notNull(),
	y: integer('y').notNull()
});

export type WorldLocationToMapSchema = InferSelectModel<typeof worldLocations_to_worldMaps>;

export const worldArticles_to_tags = sqliteTable(
	'world_articles_to_tags',
	{
		worldArticleId: text('world_article_id')
			.notNull()
			.references(() => worldArticles.id, {
				onDelete: 'cascade'
			}),
		tagId: integer('tag_id')
			.notNull()
			.references(() => tags.id, { onDelete: 'cascade' })
	},
	(t) => ({ pk: primaryKey({ columns: [t.worldArticleId, t.tagId] }) })
);

export const worldItems_to_worldCurrencies = sqliteTable(
	'world_items_to_world_currencies',
	{
		worldItemId: text('world_item_id')
			.notNull()
			.references(() => worldItems.id, { onDelete: 'cascade' }),
		worldCurrencyId: text('world_currency_id')
			.notNull()
			.references(() => worldCurrencies.id, { onDelete: 'cascade' }),
		amount: integer('amount').notNull()
	},
	(t) => ({ pk: primaryKey({ columns: [t.worldItemId, t.worldCurrencyId] }) })
);

export type WorldItemToCurrencySchema = InferSelectModel<typeof worldItems_to_worldCurrencies>;

export const worldItems_to_mediaItems = sqliteTable(
	'world_items_to_media_items',
	{
		worldItemId: text('world_item_id')
			.notNull()
			.references(() => worldItems.id, { onDelete: 'cascade' }),
		mediaItemId: integer('media_item_id')
			.notNull()
			.references(() => mediaItems.id, { onDelete: 'cascade' })
	},
	(t) => ({ pk: primaryKey({ columns: [t.worldItemId, t.mediaItemId] }) })
);

export type WorldItemToMediaItemSchema = InferSelectModel<typeof worldItems_to_mediaItems>;

export const worldCharacters_to_mediaItems = sqliteTable(
	'world_characters_to_media_items',
	{
		worldCharacterId: text('world_character_id')
			.notNull()
			.references(() => worldCharacters.id, { onDelete: 'cascade' }),
		mediaItemId: integer('media_item_id')
			.notNull()
			.references(() => mediaItems.id, { onDelete: 'cascade' })
	},
	(t) => ({ pk: primaryKey({ columns: [t.worldCharacterId, t.mediaItemId] }) })
);
