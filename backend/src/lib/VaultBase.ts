import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import WebSocket from 'ws';
import type { Vault } from '../db/master/schema';
import * as vaultSchema from '../db/vault/schema';
import { WebSocketEvent } from '../types/WebSocketEvent';
import { Job, JobAction, JobTag } from './Job';

export type VaultDb = BetterSQLite3Database<typeof vaultSchema>;

export abstract class VaultBase implements Vault {
	public id: string;
	public name: string | null;
	public path: string;
	public createdAt: number;
	public hasInstalledSD: number;
	public db: VaultDb;
	public civitaiApiKey: string | null;
	public sockets: Set<WebSocket>;
	private jobs: Map<string, Job> = new Map();

	public constructor(vault: Vault) {
		this.id = vault.id;
		this.name = vault.name;
		this.path = vault.path;
		this.createdAt = vault.createdAt;
		this.hasInstalledSD = vault.hasInstalledSD;
		this.civitaiApiKey = vault.civitaiApiKey;
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
				job.on('update', (payload: unknown) => {
					console.log(payload);
					this.broadcastEvent({
						event: 'job-update',
						data: {
							id: job.id,
							name: job.name,
							tag: job.tag,
							payload
						}
					});
				});
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

		try {
			const result = await job.action(job);
			// If the job was cancelled in the meantime, we won't emit a job complete event
			if (job.isRunning) {
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
			job.emit('job-execution-error', { id: job.id, error: (error as Error).message });
		}

		job.isRunning = false;
	}
}
