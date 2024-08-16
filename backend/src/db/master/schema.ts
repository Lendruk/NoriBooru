import type { InferSelectModel } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const vaults = sqliteTable('vaults', {
	id: text('id').primaryKey(),
	path: text('path').notNull()
});

export type Vault = InferSelectModel<typeof vaults>;
