import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import fs from 'fs/promises';
import WebSocket from 'ws';
import * as vaultSchema from '../db/vault/schema';
import { VaultConfig } from '../types/VaultConfig';
import { WebSocketEvent } from '../types/WebSocketEvent';
import { Job, JobAction, JobTag } from './Job';
import { VaultMigrator, Version } from './VaultMigrator';

export type VaultDb = BetterSQLite3Database<typeof vaultSchema>;

export abstract class VaultBase implements VaultConfig {
	public id: string;
	public name: string;
	public path: string;
	public createdAt: number;
	public hasInstalledSD: boolean;
	public version: Version;
	public db: VaultDb;
	public civitaiApiKey: string | null;
	public sockets: Set<WebSocket>;
	private jobs: Map<string, Job> = new Map();

	private static initSqlPath = `${process.cwd()}/migrations/vault/init.sql`;

	public constructor(vault: VaultConfig) {
		this.id = vault.id;
		this.name = vault.name;
		this.path = vault.path;
		this.version = vault.version;
		this.createdAt = vault.createdAt;
		this.hasInstalledSD = vault.hasInstalledSD;
		this.civitaiApiKey = vault.civitaiApiKey;
		// Create db connection
		const newDb = new Database(`${vault.path}/vault.sqlite`);
		this.db = drizzle(newDb, { schema: vaultSchema });
		this.sockets = new Set();
	}

	public async init(): Promise<void> {
		await VaultMigrator.migrateVault(this);
	}

	public registerWebsocketConnection(socket: WebSocket): void {
		this.sockets.add(socket);

		if (this.jobs.size > 0) {
			this.broadcastEvent({
				event: 'current-jobs',
				data: { jobs: Array.from(this.jobs.values()) }
			});
		}
		socket.on('close', () => {
			this.sockets.delete(socket);
		});
	}

	public async registerJob(job: Job): Promise<void> {
		this.jobs.set(job.id, job);
	}

	public async registerNewJob(
		name: string,
		action: JobAction,
		tag: JobTag,
		repeatEvery?: number
	): Promise<void> {
		const id = randomUUID();
		const newJob: Job = new Job(tag, name, action, repeatEvery);
		this.jobs.set(id, newJob);
	}

	public async runJob(jobId: string): Promise<void> {
		if (this.jobs.has(jobId)) {
			const job = this.jobs.get(jobId)!;
			if (!job.isRunning) {
				job.isRunning = true;
				void this.runWrappedJob(job);
			}
		}
	}

	public broadcastEvent<E extends string, P extends Record<string, unknown>>(
		event: WebSocketEvent<E, P>
	): void {
		for (const socket of this.sockets) {
			socket.send(JSON.stringify(event));
		}
	}

	public async unregisterJob(jobId: string): Promise<void> {
		if (this.jobs.has(jobId)) {
			this.jobs.delete(jobId);
		}
	}

	private async runWrappedJob(job: Job): Promise<void> {
		job.isRunning = true;
		let handler: NodeJS.Timeout | undefined;
		try {
			handler = setInterval(() => {
				if (job.isRunning) {
					this.broadcastEvent({
						event: 'job-update',
						data: {
							id: job.id,
							name: job.name,
							tag: job.tag,
							payload: job.runtimeData
						}
					});
				}
			}, job.updateEvery);
			const result = await job.action(job);
			// If the job was cancelled in the meantime, we won't emit a job complete event
			if (job.isRunning) {
				job.isRunning = false;
				clearInterval(handler);
				this.broadcastEvent({
					event: 'job-done',
					data: {
						id: job.id,
						result
					}
				});
				this.unregisterJob(job.id);
			}
		} catch (error) {
			this.broadcastEvent({
				event: 'job-execution-error',
				data: {
					id: job.id,
					error: (error as Error).message
				}
			});
		} finally {
			if (handler) {
				clearInterval(handler);
			}
			job.isRunning = false;
		}
	}

	public getConfig(): VaultConfig {
		return {
			id: this.id,
			name: this.name,
			path: this.path,
			createdAt: this.createdAt,
			hasInstalledSD: this.hasInstalledSD,
			civitaiApiKey: this.civitaiApiKey,
			version: this.version
		};
	}

	public async saveConfig(): Promise<void> {
		await fs.writeFile(
			`${this.path}/vault.config.json`,
			JSON.stringify(
				{
					id: this.id,
					name: this.name,
					path: this.path,
					createdAt: this.createdAt,
					hasInstalledSD: this.hasInstalledSD,
					civitaiApiKey: this.civitaiApiKey,
					version: this.version
				} satisfies VaultConfig,
				null,
				2
			)
		);
	}
}
