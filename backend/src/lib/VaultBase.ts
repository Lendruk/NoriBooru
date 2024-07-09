import Database from 'better-sqlite3';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import WebSocket from 'ws';
import type { Vault } from '../db/master/schema';
import * as vaultSchema from '../db/vault/schema';
import { WebSocketEvent } from '../types/WebSocketEvent';

export type VaultDb = BetterSQLite3Database<typeof vaultSchema>;

export abstract class VaultBase implements Vault {
	public id: string;
	public name: string | null;
	public path: string;
	public createdAt: number;
	public hasInstalledSD: number;
	public db: VaultDb;
	public sockets: Set<WebSocket>;

	public constructor(vault: Vault) {
		this.id = vault.id;
		this.name = vault.name;
		this.path = vault.path;
		this.createdAt = vault.createdAt;
		this.hasInstalledSD = vault.hasInstalledSD;
		// Create db connection
		const newDb = new Database(`${vault.path}/vault.sqlite`);
		this.db = drizzle(newDb, { schema: vaultSchema });
		this.sockets = new Set();
	}

  
	public async init(): Promise<void> {
		await migrate(this.db, { migrationsFolder: 'migrations/vault' });
	}
  
	public registerWebsocketConnection(socket: WebSocket): void {
		this.sockets.add(socket);
		socket.on('close', () => {
			this.sockets.delete(socket);
		});
	}

	public broadcastEvent<E extends string, P extends Record<string, unknown>>(event: WebSocketEvent<E, P>): void {
		for (const socket of this.sockets) {
			socket.send(JSON.stringify(event));
		}
	}
}