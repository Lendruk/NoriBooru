import type { InferSelectModel } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const vaults = sqliteTable('vaults', {
	id: text('id').primaryKey(),
	name: text('name'),
	path: text('path').notNull(),
	createdAt: integer('createdAt').notNull().default(Date.now()),
	hasInstalledSD: integer('has_installed_sd').notNull().default(0),
	civitaiApiKey: text('civitai_apikey'),
});

export type Vault = InferSelectModel<typeof vaults>;
