import { WebSocket } from '@fastify/websocket';
import { ChildProcessWithoutNullStreams, exec, spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import { createConnection } from 'net';
import path from 'path';
import kill from 'tree-kill';
import { promisify } from 'util';
import {
	ActiveWatcherSchema,
	sdCheckpoints,
	sdLoras,
	sdPrompts,
	sdWildcards
} from '../db/vault/schema';
import TagService from '../services/TagService';
import { RawSDCheckpoint } from '../types/sd/RawSDCheckpoint';
import { RawSDLora } from '../types/sd/RawSDLora';
import { VaultConfig } from '../types/VaultConfig';
import { VaultBase } from './VaultBase';
import { ActiveWatcher } from './watchers/ActiveWatcher';
import { PageWatcherService } from './watchers/PageWatcherService';

const execAsync = promisify(exec);
type ProcessEntry = {
	process: ChildProcessWithoutNullStreams;
	isActive: boolean;
	port: number;
};

export class VaultInstance extends VaultBase {
	private sdProcess?: ProcessEntry;
	private inactiveProcessTimer?: NodeJS.Timeout;
	private watcherService: PageWatcherService;

	/**
	 * Current SD ui link
	 * Using the Automatic1111 web ui
	 */
	private static readonly SD_UI_LINK =
		'https://github.com/AUTOMATIC1111/stable-diffusion-webui.git';
	private static readonly PROCESS_INACTIVE_TTL = 60 * 1000 * 10; // 10 Minutes

	public constructor(vault: VaultConfig) {
		super(vault);
		this.watcherService = new PageWatcherService(this);
	}

	public override async init(): Promise<void> {
		await super.init();
		await this.watcherService.init();
	}

	public getWatchers(): ActiveWatcherSchema[] {
		return this.watcherService.getWatchers();
	}

	public isThereWatcherWithUrl(url: string): boolean {
		return this.watcherService.isThereWatcherWithUrl(url);
	}

	public async registerWatcher(
		url: string,
		description: string,
		requestInterval: number,
		itemsPerRequest: number,
		inactivityTimeout: number
	): Promise<ActiveWatcher> {
		return await this.watcherService.createWatcher(
			url,
			description,
			requestInterval,
			itemsPerRequest,
			inactivityTimeout
		);
	}

	public async pauseWatcher(watcherId: string): Promise<void> {
		await this.watcherService.pauseWatcher(watcherId);
	}

	public async deleteWatcher(watcherId: string): Promise<void> {
		await this.watcherService.deleteWatcher(watcherId);
	}

	public getSdPort(): number | undefined {
		return this.sdProcess?.port;
	}

	private async modifySDUiPort(path: string, port: number): Promise<void> {
		await fs.writeFile(
			`${path}/stable-diffusion-webui/webui-user.sh`,
			`export COMMANDLINE_ARGS="--api --nowebui --port ${port}"`
		);
	}

	public async setName(name: string): Promise<void> {
		this.name = name;
		await this.saveConfig();
	}

	public async setCivitaiApiKey(key: string): Promise<void> {
		this.civitaiApiKey = key;
		await this.saveConfig();
	}

	public async installSDUi(): Promise<void> {
		if (this.hasInstalledSD) {
			return;
		}

		try {
			const { stderr, stdout } = await execAsync(
				`bash ./scripts/installAutomatic.sh ${this.path} ${VaultInstance.SD_UI_LINK}`
			);

			this.hasInstalledSD = true;
			if (!(await TagService.doesTagExist(this, 'AI'))) {
				await TagService.createTag(this, 'AI', '#3264a8');
			}
			console.log(stderr);
			console.log(stdout);

			await this.startSDUi();
		} catch (error) {
			this.hasInstalledSD = false;
		} finally {
			await this.saveConfig();
		}
	}

	public async uninstallSDUi(): Promise<void> {
		if (this.hasInstalledSD) {
			await this.stopSDUi();
			await this.db.delete(sdCheckpoints);
			await this.db.delete(sdLoras);
			await this.db.delete(sdPrompts);
			await this.db.delete(sdWildcards);
			await fs.rm(path.join(this.path, 'stable-diffusion-webui'), { recursive: true, force: true });
			this.hasInstalledSD = false;
			await this.saveConfig();
		}
	}

	public markProcessAsActive(): void {
		if (this.sdProcess) {
			if (!this.sdProcess.isActive) {
				if (this.inactiveProcessTimer) {
					clearTimeout(this.inactiveProcessTimer);
				}
			}
			this.sdProcess.isActive = true;
		}
	}

	public markProcessAsInactive(): void {
		if (this.sdProcess && this.sdProcess.isActive) {
			this.sdProcess.isActive = false;
			this.inactiveProcessTimer = setTimeout(() => {
				this.stopSDUi();
			}, VaultInstance.PROCESS_INACTIVE_TTL);
		}
	}

	public isSDUiRunning(): boolean {
		return !!this.sdProcess;
	}

	public async startSDUi(): Promise<number> {
		if (!this.sdProcess) {
			const port = await this.findOpenPort();

			try {
				await this.modifySDUiPort(this.path, port);
			} catch (error) {
				console.log(error);
				throw error;
			}
			const newProcess = spawn('bash', [`${this.path}/stable-diffusion-webui/webui.sh`]);
			newProcess.on('error', (err) => console.log(err));
			newProcess.stdout.on('data', (data) => {
				console.log(data.toString());
			});

			const startUpCompletionPromise = new Promise<void>((resolve) => {
				const startUpListener = (data: Buffer) => {
					if (data.toString().includes('Application startup complete.')) {
						resolve();
						newProcess.stderr.removeListener('data', startUpListener);
					}
				};
				newProcess.stderr.addListener('data', startUpListener);
			});

			newProcess.stderr.on('data', (data) => {
				console.log(data.toString());
			});
			this.sdProcess = {
				process: newProcess,
				isActive: true,
				port
			};

			await startUpCompletionPromise;
			await this.refreshCheckpoints();
			await this.refreshLoras();

			this.broadcastEvent({ event: 'SD', data: { status: 'RUNNING' } });
			return port;
		} else {
			this.markProcessAsActive();
			return this.sdProcess!.port;
		}
	}

	public stopSDUi(): void {
		console.log(`Stopping SD ui for vault ${this.name}`);
		if (this.sdProcess) {
			if (this.sdProcess.process.pid) {
				kill(this.sdProcess.process.pid);
				this.sdProcess = undefined;
				this.broadcastEvent({ event: 'SD', data: { status: 'NOT_RUNNING' } });
			}
		}
	}

	public async refreshLoras(): Promise<void> {
		const sdPort = this.getSdPort();
		if (!sdPort) {
			throw new Error('Cannot refresh loras the SD ui is not running');
		}

		await fetch(`http://localhost:${sdPort}/sdapi/v1/refresh-loras`, {
			method: 'POST'
		});

		const result = await fetch(`http://localhost:${sdPort}/sdapi/v1/loras`);
		const sdClientLoras = (await result.json()) as RawSDLora[];
		const savedLoras = await this.db.query.sdLoras.findMany();

		for (const rawLora of sdClientLoras) {
			const savedLora = savedLoras.find((lora) => lora.path === rawLora.path);

			// We need to create a new lora in our database
			if (!savedLora) {
				await this.db.insert(sdLoras).values({
					id: randomUUID(),
					name: rawLora.name,
					path: rawLora.path,
					origin: 'LOCAL',
					sdVersion: '',
					activationWords: '',
					metadata: JSON.stringify(rawLora.metadata)
				});
			} else {
				if (!savedLora.metadata) {
					await this.db
						.update(sdLoras)
						.set({ metadata: JSON.stringify(rawLora.metadata) })
						.where(eq(sdLoras.id, savedLora.id));
				}
			}
		}

		// We need to also check if something has been deleted from the file system
		for (const savedLora of savedLoras) {
			const sdClientLora = sdClientLoras.find((lora) => lora.path === savedLora.path);

			if (!sdClientLora) {
				await this.db.delete(sdLoras).where(eq(sdLoras.id, savedLora.id));
			}
		}
	}

	public async refreshCheckpoints(): Promise<void> {
		const sdPort = this.getSdPort();
		if (!sdPort) {
			throw new Error('Cannot refresh checkpoints the SD ui is not running');
		}
		await fetch(`http://localhost:${sdPort}/sdapi/v1/refresh-checkpoints`, {
			method: 'POST'
		});

		const result = await fetch(`http://localhost:${sdPort}/sdapi/v1/sd-models`);
		const sdClientCheckpoints = (await result.json()) as RawSDCheckpoint[];
		console.log(sdClientCheckpoints);
		const savedCheckpoints = await this.db.query.sdCheckpoints.findMany();

		for (const rawCheckpoint of sdClientCheckpoints) {
			const savedCheckpoint = savedCheckpoints.find(
				(checkpoint) => checkpoint.path === rawCheckpoint.filename
			);

			if (!savedCheckpoint) {
				await this.db.insert(sdCheckpoints).values({
					id: randomUUID(),
					name: rawCheckpoint.model_name,
					origin: 'LOCAL',
					path: rawCheckpoint.filename,
					sdVersion: '',
					sha256: rawCheckpoint.sha256 ?? ''
				});
			}
		}

		// We need to also check if something has been deleted from the file system
		for (const savedCheckpoint of savedCheckpoints) {
			const sdClientCheckpoint = sdClientCheckpoints.find(
				(checkpoint) => checkpoint.filename === savedCheckpoint.path
			);

			if (!sdClientCheckpoint) {
				await this.db.delete(sdCheckpoints).where(eq(sdCheckpoints.id, savedCheckpoint.id));
			}
		}
	}

	public override registerWebsocketConnection(connection: WebSocket) {
		super.registerWebsocketConnection(connection);
		connection.send(
			JSON.stringify({
				event: 'SD',
				data: { status: this.isSDUiRunning() ? 'RUNNING' : 'NOT_RUNNING' }
			})
		);
	}

	private async findOpenPort(): Promise<number> {
		for (let i = 9000; i < 65535; i++) {
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
