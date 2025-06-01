import { PromptBody } from '@nori/types/sd/SDPrompting';
import { Text2ImgPromptBody } from '@nori/types/sd/Text2ImgPromptBody';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { inject, injectable } from 'inversify';
import { createConnection } from 'net';
import kill from 'tree-kill';
import { MediaItemMetadataSchema } from '../../db/vault/schema';
import { VaultDb } from '../../lib/VaultAPI';
import { MediaService } from '../MediaService';
import { TagService } from '../TagService';
import { VaultConfigService } from '../VaultConfigService';
import { WebsocketService } from '../WebsocketService';
import { SDCheckpointService } from './SDCheckpointService';

type PromptResponse = {
	fileName: string;
	id: number;
	metadata: MediaItemMetadataSchema;
	isArchived: boolean;
};

type SDPromptResponse = {
	images: string[];
};

type ProcessEntry = {
	process: ChildProcessWithoutNullStreams;
	isActive: boolean;
	port: number;
	authToken: string;
};

type SDServerLoraPayload = { path: string; strength: number };
type SDServerText2ImgPromptBody = {
	positive_prompt: string;
	negative_prompt: string;
	model: string;
	loras: SDServerLoraPayload[];
	steps: number;
	width: number;
	height: number;
	seed: number;
	scheduler: string;
	cfgScale: number;
	iterations: number;
};

@injectable()
export class SDService {
	private static readonly PROCESS_INACTIVE_TTL = 60 * 1000 * 10; // 10 Minutes

	private sdProcess?: ProcessEntry;
	private inactiveProcessTimer?: NodeJS.Timeout;

	public constructor(
		@inject(VaultConfigService) private readonly vaultConfig: VaultConfigService,
		@inject('db') private readonly db: VaultDb,
		@inject(WebsocketService) private readonly websocketService: WebsocketService,
		@inject(TagService) private readonly tagService: TagService,
		@inject(MediaService) private readonly mediaService: MediaService,
		@inject(SDCheckpointService) private readonly sdCheckpointService: SDCheckpointService
	) {}

	public async startSDServer(): Promise<void> {
		if (!this.sdProcess) {
			const port = await this.findOpenPort();
			const authToken = randomUUID();
			const cachePath = `${this.vaultConfig.getConfigValue('path')}/sd/diffusers_cache`;
			const newProcess = spawn('python3', [
				'../sd-server/main.py',
				authToken,
				port.toString(),
				cachePath
			]);
			newProcess.on('error', (err) => console.log(err));
			newProcess.on('message', (msg) => console.log(msg));
			newProcess.stderr.on('data', (data) => {
				console.log(data.toString());
			});
			newProcess.stdout.on('data', (data) => {
				console.log(data.toString());
			});

			const startUpCompletionPromise = new Promise<void>((resolve) => {
				const startUpListener = (data: Buffer) => {
					if (data.toString().includes('Running on http://127.0.0.1:')) {
						resolve();
						newProcess.stderr.removeListener('data', startUpListener);
					}
				};
				newProcess.stderr.addListener('data', startUpListener);
			});

			this.sdProcess = {
				process: newProcess,
				isActive: true,
				port,
				authToken
			};

			await startUpCompletionPromise;
			this.websocketService.broadcastEvent({ event: 'SD', data: { status: 'RUNNING' } });
		} else {
			this.markProcessAsActive();
		}
	}

	public async stopSDServer(): Promise<void> {
		console.log(`Stopping SD ui for vault ${this.vaultConfig.getConfig().name}`);
		if (this.sdProcess) {
			if (this.sdProcess.process.pid) {
				kill(this.sdProcess.process.pid);
				this.sdProcess = undefined;
				this.websocketService.broadcastEvent({ event: 'SD', data: { status: 'NOT_RUNNING' } });
			}
		}
	}

	public async prompt(options: {
		autoTag: boolean;
		checkpointId: string;
		loras: string[];
		prompt: Text2ImgPromptBody;
	}): Promise<PromptResponse[]> {
		const { prompt, autoTag, checkpointId, loras } = options;

		const mappedPrompt = await this.mapSDPromptToSDServerRequest(prompt, checkpointId);
		console.log(mappedPrompt);
		const result = await fetch(`http://127.0.0.1:${this.getSdPort()}/sd/text2img`, {
			method: 'POST',
			body: JSON.stringify(mappedPrompt),
			headers: {
				'Content-Type': 'application/json',
				Authorization: `${this.sdProcess?.authToken}`
			}
		});
		const body = (await result.json()) as SDPromptResponse;
		const items: PromptResponse[] = [];

		for (const image of body.images) {
			const { fileName, id } = await this.mediaService.createItemFromBase64({
				base64EncodedImage: image,
				fileExtension: 'png',
				sdCheckPointId: checkpointId,
				loras
			});
			const metadata = await this.mediaService.getItemMetadata(id);
			items.push({ fileName, id, metadata, isArchived: false });
		}

		// Prompt tags
		// Can be optimized
		if (autoTag) {
			await this.mediaService.tagMediaItemFromPrompt(
				items.map((item) => item.id),
				mappedPrompt.positive_prompt.concat(' ', mappedPrompt.negative_prompt)
			);
		}

		return items;
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

	public isSDServerRunning(): boolean {
		return !!this.sdProcess;
	}

	public getSdPort(): number | undefined {
		return this.sdProcess?.port;
	}

	public markProcessAsInactive(): void {
		if (this.sdProcess && this.sdProcess.isActive) {
			this.sdProcess.isActive = false;
			this.inactiveProcessTimer = setTimeout(() => {
				this.stopSDServer();
			}, SDService.PROCESS_INACTIVE_TTL);
		}
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

	private async mapSDPromptToSDServerRequest(
		prompt: Text2ImgPromptBody,
		checkpointId: string
	): Promise<SDServerText2ImgPromptBody> {
		const checkpointPath = (await this.sdCheckpointService.getCheckpoint(checkpointId)).path;
		const seed = prompt.seed === -1 ? Math.floor(Math.random() * 1000000000) : prompt.seed;

		const [positivePrompt, positiveLoras] = this.mapPromptBodyToSimplePrompt(
			prompt.positive_prompt
		);
		const [negativePrompt, negativeLoras] = this.mapPromptBodyToSimplePrompt(
			prompt.negative_prompt
		);
		return {
			positive_prompt: positivePrompt,
			negative_prompt: negativePrompt,
			loras: positiveLoras.concat(negativeLoras),
			height: prompt.height,
			width: prompt.width,
			steps: prompt.steps,
			seed: seed,
			scheduler: prompt.scheduler,
			model: checkpointPath,
			iterations: prompt.iterations,
			cfgScale: prompt.cfgScale
		};
	}

	public mapPromptBodyToSimplePrompt(promptBody: PromptBody): [string, SDServerLoraPayload[]] {
		const loras: SDServerLoraPayload[] = [];
		let prompt = '';
		for (const item of promptBody) {
			if ('text' in item) {
				prompt += `${prompt.length > 0 ? ', ' : ''}${item.text}`;
			} else if ('tag' in item) {
				prompt += `${prompt.length > 0 ? ', ' : ''}${item.tag.name}`;
			} else if ('lora' in item) {
				if (item.activatedWords) {
					for (const activationWord of item.activatedWords) {
						prompt += `, ${activationWord}`;
					}
				}
				loras.push({ path: item.lora.path, strength: item.strength });
			} else if ('wildcard' in item) {
				const { values } = item.wildcard;
				const randomValue = values[Math.floor(Math.random() * values.length)];
				prompt += randomValue;
			}
		}

		return [prompt, loras];
	}
}
