import { WebSocket } from '@fastify/websocket';
import { ChildProcessWithoutNullStreams, exec, spawn } from 'child_process';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import { createConnection } from 'net';
import kill from 'tree-kill';
import { promisify } from 'util';
import { masterDb } from '../db/master/db';
import { Vault, vaults } from '../db/master/schema';
import { VaultBase } from './VaultBase';

const execAsync = promisify(exec);
type ProcessEntry = {
	process: ChildProcessWithoutNullStreams;
	isActive: boolean;
	port: number;
};

export class VaultInstance extends VaultBase {
	private sdProcess?: ProcessEntry;
	private inactiveProcessTimer?: NodeJS.Timeout;

	/**
	 * Current SD ui link
	 * Using the Automatic1111 web ui
	 */
	private static readonly SD_UI_LINK =
		'https://github.com/AUTOMATIC1111/stable-diffusion-webui.git';
	private static readonly PROCESS_INACTIVE_TTL = 60 * 1000 * 10; // 10 Minutes
  
	public constructor(vault: Vault) {
		super(vault);
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

  
	public async install(): Promise<void> {
		if (this.hasInstalledSD) {
			return;
		}

		const { stderr, stdout } = await execAsync(
			`bash ./scripts/installAutomatic.sh ${this.path} ${VaultInstance.SD_UI_LINK}`
		);

		await masterDb.update(vaults).set({ hasInstalledSD: 1 }).where(eq(vaults.id, this.id));
		await this.startSDUi();

		console.log(stderr);
		console.log(stdout);
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
				kill(this.sdProcess.process.pid, );
				this.sdProcess = undefined;
				this.broadcastEvent({ event: 'SD', data: { status: 'NOT_RUNNING' } });
			}
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

	public override registerWebsocketConnection(connection: WebSocket) {
		super.registerWebsocketConnection(connection);
		connection.send(JSON.stringify({ event: 'SD', data: { status: this.isSDUiRunning() ? 'RUNNING' : 'NOT_RUNNING' } }));
	}
}