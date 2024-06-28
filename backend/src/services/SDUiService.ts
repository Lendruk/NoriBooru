import { ChildProcessWithoutNullStreams, exec, spawn } from 'child_process';
import { VaultInstance } from '../db/VaultController';
import { promisify } from 'util';
import kill from 'tree-kill';
import fs from 'fs/promises';
import { createConnection } from 'net';
import { masterDb } from '../db/master/db';
import { vaults } from '../db/master/schema';
import { eq } from 'drizzle-orm';

const execAsync = promisify(exec);

type ProcessEntry = {
	process: ChildProcessWithoutNullStreams;
	isActive: boolean;
	port: number;
}

class SDUiService {
	private processMap:  Map<string, ProcessEntry> = new Map();
	private inactiveProcessTimers: Map<string, NodeJS.Timeout> = new Map();
	
	/**
	 * Current SD ui link
	 * Using the Automatic1111 web ui
	*/
	private static readonly SD_UI_LINK = 'https://github.com/AUTOMATIC1111/stable-diffusion-webui.git';
	
	private static readonly PROCESS_INACTIVE_TTL = 60 * 1000 * 10; // 10 Minutes
	public constructor() {
		process.on('SIGINT', () => {
			console.log(`Shutdown received killing ${this.processMap.size} child processes`);
			for(const processEntry of this.processMap.values()) {
				setTimeout(() => {
					processEntry.process.kill();
				}, 1000);
			}
			process.exit(0);
		});
	}

	public getSdPort(vaultId: string): number | undefined {
		const entry = this.processMap.get(vaultId);
		if(entry) {
			return entry.port;
		}
	}

	public async install(vault: VaultInstance): Promise<void> {
		if (vault.hasInstalledSD) {
			return;
		}

		const { stderr, stdout } = await execAsync(`bash ./scripts/installAutomatic.sh ${vault.path} ${SDUiService.SD_UI_LINK}`);

		await masterDb.update(vaults).set({ hasInstalledSD: 1 }).where(eq(vaults.id, vault.id ));
		await this.startSDUi(vault);

		console.log(stderr);
		console.log(stdout);
	}

	public markProcessAsActive(vault: VaultInstance): void {
		const processEntry = this.processMap.get(vault.id);

		if(processEntry) {
			if(!processEntry.isActive) {
				const timer = this.inactiveProcessTimers.get(vault.id);
				
				if (timer) {
					clearTimeout(timer);
				}
			}
			processEntry.isActive = true;
		}
	}

	public markProcessAsInactive(vault: VaultInstance): void {
		const processEntry = this.processMap.get(vault.id);

		if(processEntry && processEntry.isActive) {
			processEntry.isActive = false;

			const timer = setTimeout(() => {
				this.stopSDUi(vault);
			}, SDUiService.PROCESS_INACTIVE_TTL);

			this.inactiveProcessTimers.set(vault.id, timer);
		}
	}

	public async startSDUi(vault: VaultInstance): Promise<number> {
		if(!this.processMap.has(vault.id)) {
			const port = await this.findOpenPort();

			try {
				await this.modifySDUiPort(vault.path, port);
			} catch (error) {
				console.log(error);
				throw error;
			}
			const newProcess = spawn('bash',[`${vault.path}/stable-diffusion-webui/webui.sh`]);
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
			this.processMap.set(vault.id, { process: newProcess, isActive: true, port });

			await startUpCompletionPromise;
			return port;
		} else {
			this.markProcessAsActive(vault);
			return this.processMap.get(vault.id)!.port;
		}
	}

	public stopSDUi(vault: VaultInstance): void {
		console.log(`Stopping SD ui for vault ${vault.name}`);
		const processEntry = this.processMap.get(vault.id);

		if(processEntry) {
			if(processEntry.process.pid) {
				kill(processEntry.process.pid);
				this.processMap.delete(vault.id);
			}
		}
	}

	private async modifySDUiPort(path: string, port: number): Promise<void> {
		await fs.writeFile(`${path}/stable-diffusion-webui/webui-user.sh`, `export COMMANDLINE_ARGS="--api --nowebui --port ${port}"`);
	}

	private async findOpenPort(): Promise<number> {
		for (let i = 9000; i < 65535; i++) {
			try {
				await new Promise<void>((resolve, reject) => {
					const socket = createConnection({ port: i });
					socket.once('connect', () => { socket.end(); reject(); });
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

export const sdUiService = new SDUiService();