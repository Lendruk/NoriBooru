import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
const sqlite = new Database("vault.sqlite");
export const db = drizzle(sqlite, { schema });

(async () => {
  await migrate(db, { migrationsFolder: "migrations/vault" });
})();

console.log("db init");
