// import { ChildProcessWithoutNullStreams, exec, spawn } from 'child_process';
// import { randomUUID } from 'crypto';
// import { eq } from 'drizzle-orm';
// import fs from 'fs/promises';
// import { inject, injectable } from 'inversify';
// import { createConnection } from 'net';
// import path from 'path';
// import kill from 'tree-kill';
// import { promisify } from 'util';
// import {
// 	MediaItemMetadataSchema,
// 	sdCheckpoints,
// 	sdLoras,
// 	sdPrompts,
// 	sdWildcards
// } from '../db/vault/schema';
// import { VaultDb } from '../lib/VaultAPI';
// import { RawSDCheckpoint } from '../types/sd/RawSDCheckpoint';
// import { RawSDLora } from '../types/sd/RawSDLora';
// import { SDPromptResponse } from '../types/sd/SDPromptResponse';
// import { MediaService } from './MediaService';
// import { TagService } from './TagService';
// import { VaultConfigService } from './VaultConfigService';
// import { WebsocketService } from './WebsocketService';
// const execAsync = promisify(exec);
// type ProcessEntry = {
// 	process: ChildProcessWithoutNullStreams;
// 	isActive: boolean;
// 	port: number;
// };

// type PromptResponse = {
// 	fileName: string;
// 	id: number;
// 	metadata: MediaItemMetadataSchema;
// 	isArchived: boolean;
// };

// @injectable()
// export class SDService {
// 	/**
// 	 * Current SD ui link
// 	 * Using the Automatic1111 web ui
// 	 */
// 	private static readonly SD_UI_LINK =
// 		'https://github.com/AUTOMATIC1111/stable-diffusion-webui.git';
// 	private static readonly PROCESS_INACTIVE_TTL = 60 * 1000 * 10; // 10 Minutes

// 	private sdProcess?: ProcessEntry;
// 	private inactiveProcessTimer?: NodeJS.Timeout;

// 	public constructor(
// 		@inject(VaultConfigService) private readonly vaultConfig: VaultConfigService,
// 		@inject('db') private readonly db: VaultDb,
// 		@inject(WebsocketService) private readonly websocketService: WebsocketService,
// 		@inject(TagService) private readonly tagService: TagService,
// 		@inject(MediaService) private readonly mediaService: MediaService
// 	) {}

// 	public async startSDUi(): Promise<number> {
// 		if (!this.sdProcess) {
// 			const port = await this.findOpenPort();

// 			try {
// 				await this.modifySDUiPort(this.vaultConfig.path, port);
// 			} catch (error) {
// 				console.log(error);
// 				throw error;
// 			}
// 			const newProcess = spawn('bash', [
// 				`${this.vaultConfig.path}/stable-diffusion-webui/webui.sh`
// 			]);
// 			newProcess.on('error', (err) => console.log(err));
// 			newProcess.stdout.on('data', (data) => {
// 				console.log(data.toString());
// 			});

// 			const startUpCompletionPromise = new Promise<void>((resolve) => {
// 				const startUpListener = (data: Buffer) => {
// 					if (data.toString().includes('Application startup complete.')) {
// 						resolve();
// 						newProcess.stderr.removeListener('data', startUpListener);
// 					}
// 				};
// 				newProcess.stderr.addListener('data', startUpListener);
// 			});

// 			newProcess.stderr.on('data', (data) => {
// 				console.log(data.toString());
// 			});
// 			this.sdProcess = {
// 				process: newProcess,
// 				isActive: true,
// 				port
// 			};

// 			await startUpCompletionPromise;
// 			await this.refreshCheckpoints();
// 			await this.refreshLoras();

// 			this.websocketService.broadcastEvent({ event: 'SD', data: { status: 'RUNNING' } });
// 			return port;
// 		} else {
// 			this.markProcessAsActive();
// 			return this.sdProcess!.port;
// 		}
// 	}

// 	public stopSDUi(): void {
// 		console.log(`Stopping SD ui for vault ${this.vaultConfig.name}`);
// 		if (this.sdProcess) {
// 			if (this.sdProcess.process.pid) {
// 				kill(this.sdProcess.process.pid);
// 				this.sdProcess = undefined;
// 				this.websocketService.broadcastEvent({ event: 'SD', data: { status: 'NOT_RUNNING' } });
// 			}
// 		}
// 	}

// 	public async refreshLoras(): Promise<void> {
// 		const sdPort = this.getSdPort();
// 		if (!sdPort) {
// 			throw new Error('Cannot refresh loras the SD ui is not running');
// 		}

// 		await fetch(`http://localhost:${sdPort}/sdapi/v1/refresh-loras`, {
// 			method: 'POST'
// 		});

// 		const result = await fetch(`http://localhost:${sdPort}/sdapi/v1/loras`);
// 		const sdClientLoras = (await result.json()) as RawSDLora[];
// 		const savedLoras = await this.db.query.sdLoras.findMany();

// 		for (const rawLora of sdClientLoras) {
// 			const savedLora = savedLoras.find((lora) => lora.path === rawLora.path);

// 			// We need to create a new lora in our database
// 			if (!savedLora) {
// 				await this.db.insert(sdLoras).values({
// 					id: randomUUID(),
// 					name: rawLora.name,
// 					path: rawLora.path,
// 					origin: 'LOCAL',
// 					sdVersion: '',
// 					activationWords: '',
// 					metadata: JSON.stringify(rawLora.metadata)
// 				});
// 			} else {
// 				if (!savedLora.metadata) {
// 					await this.db
// 						.update(sdLoras)
// 						.set({ metadata: JSON.stringify(rawLora.metadata) })
// 						.where(eq(sdLoras.id, savedLora.id));
// 				}
// 			}
// 		}

// 		// We need to also check if something has been deleted from the file system
// 		for (const savedLora of savedLoras) {
// 			const sdClientLora = sdClientLoras.find((lora) => lora.path === savedLora.path);

// 			if (!sdClientLora) {
// 				await this.db.delete(sdLoras).where(eq(sdLoras.id, savedLora.id));
// 			}
// 		}
// 	}

// 	public async refreshCheckpoints(): Promise<void> {
// 		const sdPort = this.getSdPort();
// 		if (!sdPort) {
// 			throw new Error('Cannot refresh checkpoints the SD ui is not running');
// 		}
// 		await fetch(`http://localhost:${sdPort}/sdapi/v1/refresh-checkpoints`, {
// 			method: 'POST'
// 		});

// 		const result = await fetch(`http://localhost:${sdPort}/sdapi/v1/sd-models`);
// 		const sdClientCheckpoints = (await result.json()) as RawSDCheckpoint[];
// 		console.log(sdClientCheckpoints);
// 		const savedCheckpoints = await this.db.query.sdCheckpoints.findMany();

// 		for (const rawCheckpoint of sdClientCheckpoints) {
// 			const savedCheckpoint = savedCheckpoints.find(
// 				(checkpoint) => checkpoint.path === rawCheckpoint.filename
// 			);

// 			if (!savedCheckpoint) {
// 				await this.db.insert(sdCheckpoints).values({
// 					id: randomUUID(),
// 					name: rawCheckpoint.model_name,
// 					origin: 'LOCAL',
// 					path: rawCheckpoint.filename,
// 					sdVersion: '',
// 					sha256: rawCheckpoint.sha256 ?? ''
// 				});
// 			}
// 		}

// 		// We need to also check if something has been deleted from the file system
// 		for (const savedCheckpoint of savedCheckpoints) {
// 			const sdClientCheckpoint = sdClientCheckpoints.find(
// 				(checkpoint) => checkpoint.filename === savedCheckpoint.path
// 			);

// 			if (!sdClientCheckpoint) {
// 				await this.db.delete(sdCheckpoints).where(eq(sdCheckpoints.id, savedCheckpoint.id));
// 			}
// 		}
// 	}

// 	private async findOpenPort(): Promise<number> {
// 		for (let i = 9000; i < 65535; i++) {
// 			try {
// 				await new Promise<void>((resolve, reject) => {
// 					const socket = createConnection({ port: i });
// 					socket.once('connect', () => {
// 						socket.end();
// 						reject();
// 					});
// 					socket.once('error', (e: NodeJS.ErrnoException) => {
// 						socket.destroy();
// 						if (e.code === 'ECONNREFUSED') {
// 							resolve();
// 						} else {
// 							reject();
// 						}
// 					});
// 				});
// 				return i;
// 			} catch {
// 				continue;
// 			}
// 		}

// 		throw new Error('No available port');
// 	}

// 	public async installSDUi(): Promise<void> {
// 		if (this.vaultConfig.hasInstalledSD) {
// 			return;
// 		}

// 		try {
// 			const { stderr, stdout } = await execAsync(
// 				`bash ./scripts/installAutomatic.sh ${this.vaultConfig.path} ${SDService.SD_UI_LINK}`
// 			);

// 			this.vaultConfig.hasInstalledSD = true;
// 			if (!(await this.tagService.doesTagExist('AI'))) {
// 				await this.tagService.createTag('AI', '#3264a8');
// 			}
// 			console.log(stderr);
// 			console.log(stdout);

// 			await this.startSDUi();
// 		} catch (error) {
// 			this.vaultConfig.hasInstalledSD = false;
// 		} finally {
// 			await this.vaultConfig.saveConfig();
// 		}
// 	}

// 	public async uninstallSDUi(): Promise<void> {
// 		if (this.vaultConfig.hasInstalledSD) {
// 			await this.stopSDUi();
// 			await this.db.delete(sdCheckpoints);
// 			await this.db.delete(sdLoras);
// 			await this.db.delete(sdPrompts);
// 			await this.db.delete(sdWildcards);
// 			await fs.rm(path.join(this.vaultConfig.path, 'stable-diffusion-webui'), {
// 				recursive: true,
// 				force: true
// 			});
// 			this.vaultConfig.hasInstalledSD = false;
// 			await this.vaultConfig.saveConfig();
// 		}
// 	}

// 	public markProcessAsActive(): void {
// 		if (this.sdProcess) {
// 			if (!this.sdProcess.isActive) {
// 				if (this.inactiveProcessTimer) {
// 					clearTimeout(this.inactiveProcessTimer);
// 				}
// 			}
// 			this.sdProcess.isActive = true;
// 		}
// 	}

// 	public markProcessAsInactive(): void {
// 		if (this.sdProcess && this.sdProcess.isActive) {
// 			this.sdProcess.isActive = false;
// 			this.inactiveProcessTimer = setTimeout(() => {
// 				this.stopSDUi();
// 			}, SDService.PROCESS_INACTIVE_TTL);
// 		}
// 	}

// 	public isSDUiRunning(): boolean {
// 		return !!this.sdProcess;
// 	}

// 	public getSdPort(): number | undefined {
// 		return this.sdProcess?.port;
// 	}

// 	public async promptSD(
// 		autoTag: boolean,
// 		checkpointId: string,
// 		loras: string[],
// 		prompt: SDPromptRequest
// 	): Promise<PromptResponse[]> {
// 		const result = await fetch(`http://localhost:${this.getSdPort()}/sdapi/v1/txt2img`, {
// 			method: 'POST',
// 			body: JSON.stringify(prompt),
// 			headers: {
// 				'Content-Type': 'application/json'
// 			}
// 		});
// 		const body = (await result.json()) as SDPromptResponse;
// 		const items: PromptResponse[] = [];

// 		for (const image of body.images) {
// 			const { fileName, id } = await this.mediaService.createItemFromBase64({
// 				base64EncodedImage: image,
// 				fileExtension: 'png',
// 				sdCheckPointId: checkpointId,
// 				loras
// 			});
// 			const metadata = await this.mediaService.getItemMetadata(id);
// 			items.push({ fileName, id, metadata, isArchived: false });
// 		}

// 		// Prompt tags
// 		// Can be optimized
// 		if (autoTag) {
// 			await this.mediaService.tagMediaItemFromPrompt(
// 				items.map((item) => item.id),
// 				prompt.prompt
// 			);
// 		}
// 		return items;
// 	}

// 	public async unloadCurrentCheckpoint(): Promise<void> {
// 		await fetch(`http://localhost:${this.getSdPort()}/sdapi/v1/unload-checkpoint`, {
// 			method: 'POST'
// 		});
// 	}

// 	public async interruptGeneration(): Promise<void> {
// 		await fetch(`http://localhost:${this.getSdPort()}/sdapi/v1/interrupt`, {
// 			method: 'POST'
// 		});
// 	}

// 	private async modifySDUiPort(path: string, port: number): Promise<void> {
// 		await fs.writeFile(
// 			`${path}/stable-diffusion-webui/webui-user.sh`,
// 			`export COMMANDLINE_ARGS="--api --nowebui --port ${port}"`
// 		);
// 	}
// }
