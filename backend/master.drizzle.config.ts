import type { Config } from 'drizzle-kit';

export default {
	schema: 'src/lib/server/db/master/schema.ts',
	out: 'migrations/master',
	driver: 'better-sqlite',
	dbCredentials: {
		url: './master_db.sqlite',
	},
	verbose: true,
} satisfies Config;