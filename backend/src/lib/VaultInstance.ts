import Database from 'better-sqlite3';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { Container, injectable } from 'inversify';
import vaultSchema from '../db/vault';
import { JobService } from '../services/JobService';
import { MediaService } from '../services/MediaService';
import { PageWatcherService } from '../services/PageWatcherService';
import { SDService } from '../services/SDService';
import { TagService } from '../services/TagService';
import { VaultConfigService } from '../services/VaultConfigService';
import { WebsocketService } from '../services/WebsocketService';
import { WildcardService } from '../services/WildcardService';
import { CharacterService } from '../services/worldbuilding/CharacterService';
import { CultureService } from '../services/worldbuilding/CultureService';
import { CurrencyService } from '../services/worldbuilding/CurrencyService';
import { ItemService } from '../services/worldbuilding/ItemService';
import { SpecieService } from '../services/worldbuilding/SpecieService';
import { VaultConfig } from '../types/VaultConfig';
import { VaultMigrator } from './VaultMigrator';
import { PageParserFactory } from './watchers/PageParserFactory';

export type VaultDb = BetterSQLite3Database<typeof vaultSchema>;

@injectable()
export class VaultInstance {
	public container: Container;

	public db: VaultDb;
	public tags: TagService;
	public media: MediaService;
	public wildcards: WildcardService;
	public websockets: WebsocketService;
	public jobs: JobService;
	public stableDiffusion: SDService;
	public config: VaultConfigService;
	public watchers: PageWatcherService;

	// Worldbuilding
	public characters: CharacterService;
	public cultures: CultureService;
	public currencies: CurrencyService;
	public species: SpecieService;
	public items: ItemService;

	public constructor(vault: VaultConfig) {
		this.container = new Container();

		// Create db connection
		const newDb = new Database(`${vault.path}/vault.sqlite`);
		this.db = drizzle(newDb, { schema: vaultSchema });
		this.container.bind('db').toConstantValue(this.db);
		this.container.bind('config').toConstantValue(vault);
		this.container.bind(VaultConfigService).toSelf().inSingletonScope();
		this.container.bind(TagService).toSelf().inSingletonScope();
		this.container.bind(MediaService).toSelf().inSingletonScope();
		this.container.bind(WildcardService).toSelf().inSingletonScope();
		this.container.bind(WebsocketService).toSelf().inSingletonScope();
		this.container.bind(JobService).toSelf().inSingletonScope();
		this.container.bind(PageParserFactory).toSelf().inSingletonScope();
		this.container.bind(PageWatcherService).toSelf().inSingletonScope();
		this.container.bind(SDService).toSelf().inSingletonScope();

		// Worldbuilding
		this.container.bind(CharacterService).toSelf().inSingletonScope();
		this.container.bind(CultureService).toSelf().inSingletonScope();
		this.container.bind(CurrencyService).toSelf().inSingletonScope();
		this.container.bind(SpecieService).toSelf().inSingletonScope();
		this.container.bind(ItemService).toSelf().inSingletonScope();

		this.tags = this.container.get(TagService);
		this.media = this.container.get(MediaService);
		this.wildcards = this.container.get(WildcardService);
		this.watchers = this.container.get(PageWatcherService);
		this.websockets = this.container.get(WebsocketService);
		this.jobs = this.container.get(JobService);
		this.stableDiffusion = this.container.get(SDService);
		this.config = this.container.get(VaultConfigService);

		this.characters = this.container.get(CharacterService);
		this.cultures = this.container.get(CultureService);
		this.currencies = this.container.get(CurrencyService);
		this.species = this.container.get(SpecieService);
		this.items = this.container.get(ItemService);
	}

	public async init(): Promise<void> {
		await VaultMigrator.migrateVault(this);
		await this.watchers.init();
	}
}
