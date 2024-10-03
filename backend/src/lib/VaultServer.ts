import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import ws from '@fastify/websocket';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Fastify, { FastifyInstance } from 'fastify';
import { Container } from 'inversify';
import { createConnection } from 'net';
import vaultSchema from '../db/vault';
import { SpecieRouter } from '../routes/world-building/species/SpecieRouter';
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
import { Router } from './Router';
import { PageParserFactory } from './watchers/PageParserFactory';

export class VaultServer extends Container {
	private port: number | undefined;
	private fastifyApp!: FastifyInstance;

	public constructor(vault: VaultConfig) {
		super();

		// Create db connection
		const newDb = new Database(`${vault.path}/vault.sqlite`);
		const db = drizzle(newDb, { schema: vaultSchema });
		this.bind('db').toConstantValue(db);
		this.bind('config').toConstantValue(vault);

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

		// Worldbuilding
		this.bind(CharacterService).toSelf().inSingletonScope();
		this.bind(CultureService).toSelf().inSingletonScope();
		this.bind(CurrencyService).toSelf().inSingletonScope();
		this.bind(SpecieService).toSelf().inSingletonScope();
		this.bind(ItemService).toSelf().inSingletonScope();

		// Routers
		this.bind<Router>(Router).to(SpecieRouter).inSingletonScope();
	}

	public async init(): Promise<void> {
		// await VaultMigrator.migrateVault();
		// await this.watchers.init();
		await this.listen();
	}

	private async listen(): Promise<void> {
		this.port = await this.findOpenPort();

		const app = Fastify({
			logger: true,
			bodyLimit: 100000000 // ~100mb
		});

		const routers = this.getAll<Router>(Router);
		for (const router of routers) {
			for (const route of router.routes) {
				app.route({
					handler: route.handler,
					method: route.method,
					url: route.url
				});
			}
		}

		app.register(ws);
		app.register(cors);
		app.register(multipart, {
			limits: {
				files: 100000,
				fileSize: 107374182400
			}
		});

		app.listen({ port: this.port, host: '0.0.0.0' }, (err) => {
			if (err) throw err;
		});
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
