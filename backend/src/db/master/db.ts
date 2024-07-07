import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';

const sqlite = new Database('database.sqlite');
export const masterDb = drizzle(sqlite, { schema });

(async () => {
	await migrate(masterDb, { migrationsFolder: 'migrations/master' });
})();
console.log('Master DB initialized');
