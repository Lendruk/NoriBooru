import type { Config } from 'drizzle-kit';

export default {
	schema: 'src/db/vault/schema.ts',
	out: 'migrations/vault',
	dialect: 'sqlite',
	dbCredentials: {
		url: './database.sqlite',
	},
	verbose: true,
} satisfies Config;