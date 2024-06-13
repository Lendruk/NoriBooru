import { ChildProcessWithoutNullStreams, exec, spawn } from 'child_process';
import { VaultInstance } from '../db/VaultController';
import { promisify } from 'util';
import kill from 'tree-kill';

const execAsync = promisify(exec);

type ProcessEntry = {
	process: ChildProcessWithoutNullStreams;
	isActive: boolean;
}

class SDUiService {
	private processMap:  Map<string, ProcessEntry> = new Map();
	private inactiveProcessTimers: Map<string, NodeJS.Timeout> = new Map();
	
	/**
	 * Current SD ui link
	 * Using the Automatic1111 web ui
	*/
	private static readonly SD_UI_LINK = 'https://github.com/AUTOMATIC1111/stable-diffusion-webui.git';
	
	private static readonly PROCESS_INACTIVE_TTL = 10 * 1000; // 10 Minutes
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

	public async install(vault: VaultInstance): Promise<void> {
		if (vault.hasInstalledSD) {
			return;
		}

		const { stderr, stdout } = await execAsync(`bash ./scripts/installAutomatic.sh ${vault.path} ${SDUiService.SD_UI_LINK}`);

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

	public startSDUi(vault: VaultInstance): void {
		if(!this.processMap.has(vault.id)) {
			const newProcess = spawn('bash',[`${vault.path}/stable-diffusion-webui/webui.sh`]);
			newProcess.on('error', (err) => console.log(err));
			newProcess.stdout.on('data', (data) => {
				console.log(data.toString());
			});
	
			newProcess.stderr.on('data', (data) => {
				console.log(data.toString());
			});
			this.processMap.set(vault.id, { process: newProcess, isActive: true });
		} else {
			this.markProcessAsActive(vault);
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
}			

export const sdUiService = new SDUiService();