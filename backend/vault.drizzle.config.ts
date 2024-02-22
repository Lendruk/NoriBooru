import type { Config } from 'drizzle-kit';

export default {
	schema: 'src/lib/server/db/vault/schema.ts',
	out: 'migrations/vault',
	driver: 'better-sqlite',
	dbCredentials: {
		url: './database.sqlite',
	},
	verbose: true,
} satisfies Config;