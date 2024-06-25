import type { Config } from 'drizzle-kit';

export default {
	schema: 'src/db/master/schema.ts',
	out: 'migrations/master',
	dialect: 'sqlite',
	dbCredentials: {
		url: './database.sqlite',
	},
	verbose: true,
} satisfies Config;