import Database from 'better-sqlite3';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { createConnection } from 'net';
import vaultSchema from '../db/vault';
import { MediaItemRouter } from '../routes/vault/MediaItemRouter';
import { PlaylistRouter } from '../routes/vault/PlaylistRouter';
import { CivitaiRouter } from '../routes/vault/sd/CivitaiRouter';
import { LoraRouter } from '../routes/vault/sd/LoraRouter';
import { PromptRouter } from '../routes/vault/sd/PromptRouter';
import { SDCheckpointRouter } from '../routes/vault/sd/SDCheckpointRouter';
import { SDRouter } from '../routes/vault/sd/SDRouter';
import { WildcardRouter } from '../routes/vault/sd/WildcardRouter';
import { SettingsRouter } from '../routes/vault/SettingsRouter';
import { TagRouter } from '../routes/vault/TagRouter';
import { WatcherRouter } from '../routes/vault/WatcherRouter';
import { WebsocketRouter } from '../routes/vault/WebsocketRouter';
import { CultureRouter } from '../routes/vault/world-building/CultureRouter';
import { CurrencyRouter } from '../routes/vault/world-building/CurrencyRouter';
import { SpecieRouter } from '../routes/vault/world-building/SpecieRouter';
import { JobService } from '../services/JobService';
import { MediaService } from '../services/MediaService';
import { PageWatcherService } from '../services/PageWatcherService';
import { PlaylistService } from '../services/PlaylistService';
import { PromptService } from '../services/SD/PromptService';
import { SDCheckpointService } from '../services/SD/SDCheckpointService';
import { SDLoraService } from '../services/SD/SDLoraService';
import { WildcardService } from '../services/SD/WildcardService';
import { SDService } from '../services/SDService';
import { TagService } from '../services/TagService';
import { VaultConfigService } from '../services/VaultConfigService';
import { WebsocketService } from '../services/WebsocketService';
import { CharacterService } from '../services/worldbuilding/CharacterService';
import { CultureService } from '../services/worldbuilding/CultureService';
import { CurrencyService } from '../services/worldbuilding/CurrencyService';
import { ItemService } from '../services/worldbuilding/ItemService';
import { SpecieService } from '../services/worldbuilding/SpecieService';
import { VaultConfig } from '../types/VaultConfig';
import { IoCAPI } from './IoCAPI';
import { Router } from './Router';
import { VaultMigrator } from './VaultMigrator';
import { PageParserFactory } from './watchers/PageParserFactory';

export type VaultDb = BetterSQLite3Database<typeof vaultSchema>;

export class VaultAPI extends IoCAPI {
	public constructor(config: VaultConfig) {
		super();

		// Create db connection
		const newDb = new Database(`${config.path}/vault.sqlite`);
		const db = drizzle(newDb, { schema: vaultSchema });
		this.bind('db').toConstantValue(db);
		this.bind('config').toConstantValue(config);

		// Core
		this.bind(VaultMigrator).toSelf().inSingletonScope();

		// Services
		this.bind(VaultConfigService).toSelf().inSingletonScope();
		this.bind(TagService).toSelf().inSingletonScope();
		this.bind(MediaService).toSelf().inSingletonScope();
		this.bind(WildcardService).toSelf().inSingletonScope();
		this.bind(WebsocketService).toSelf().inSingletonScope();
		this.bind(JobService).toSelf().inSingletonScope();
		this.bind(PageParserFactory).toSelf().inSingletonScope();
		this.bind(PageWatcherService).toSelf().inSingletonScope();
		this.bind(SDService).toSelf().inSingletonScope();
		this.bind(PlaylistService).toSelf().inSingletonScope();
		this.bind(SDCheckpointService).toSelf().inSingletonScope();
		this.bind(SDLoraService).toSelf().inSingletonScope();
		this.bind(PromptService).toSelf().inSingletonScope();

		// Worldbuilding
		this.bind(CharacterService).toSelf().inSingletonScope();
		this.bind(CultureService).toSelf().inSingletonScope();
		this.bind(CurrencyService).toSelf().inSingletonScope();
		this.bind(SpecieService).toSelf().inSingletonScope();
		this.bind(ItemService).toSelf().inSingletonScope();

		this.bind(Router).to(SpecieRouter).inSingletonScope();
		this.bind(Router).to(CultureRouter).inSingletonScope();
		this.bind(Router).to(CurrencyRouter).inSingletonScope();

		// Routers
		this.bind(Router).to(TagRouter).inSingletonScope();
		this.bind(Router).to(MediaItemRouter).inSingletonScope();
		this.bind(Router).to(WatcherRouter).inSingletonScope();
		this.bind(Router).to(PlaylistRouter).inSingletonScope();
		this.bind(Router).to(SettingsRouter).inSingletonScope();
		this.bind(Router).to(SDCheckpointRouter).inSingletonScope();
		this.bind(Router).to(SDRouter).inSingletonScope();
		this.bind(Router).to(WildcardRouter).inSingletonScope();
		this.bind(Router).to(PromptRouter).inSingletonScope();
		this.bind(Router).to(LoraRouter).inSingletonScope();
		this.bind(Router).to(CivitaiRouter).inSingletonScope();
		this.bind(Router).to(WebsocketRouter).inSingletonScope();
	}

	public getDb(): VaultDb {
		return this.get('db');
	}

	public getConfig(): VaultConfig {
		return this.get('config');
	}

	public getPort(): number | undefined {
		return this.port;
	}

	public async init(): Promise<void> {
		await this.get(VaultMigrator).init();
		await this.get(VaultMigrator).migrateVault(this);
		await this.get(PageWatcherService).init();
		this.port = await this.findOpenPort();
		await this.listen();
	}

	private async findOpenPort(): Promise<number> {
		for (let i = 8000; i < 65535; i++) {
			try {
				await new Promise<void>((resolve, reject) => {
					const socket = createConnection({ port: i });
					socket.once('connect', () => {
						socket.end();
						reject();
					});
					socket.once('error', (e: NodeJS.ErrnoException) => {
						socket.destroy();
						if (e.code === 'ECONNREFUSED') {
							resolve();
						} else {
							reject();
						}
					});
				});
				return i;
			} catch {
				continue;
			}
		}

		throw new Error('No available port');
	}
}
