import { ChildProcessWithoutNullStreams, exec, spawn } from 'child_process';
import { VaultInstance } from '../db/VaultController';
import { promisify } from 'util';

const execAsync = promisify(exec);

class SDUiService {

	private processMap:  Map<string, ChildProcessWithoutNullStreams> = new Map();

	/**
   * Current SD ui link
   * Using the Automatic1111 web ui
   */
	private static readonly SD_UI_LINK = 'https://github.com/AUTOMATIC1111/stable-diffusion-webui.git';

	public constructor() {
		process.on('SIGINT', () => {
			console.log(`Shutdown received killing ${this.processMap.size} child processes`);
			for(const childProcess of this.processMap.values()) {
				setTimeout(() => {
					childProcess.kill();
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
			this.processMap.set(vault.id, newProcess);
		}
	}

	public stopSDUi(vault: VaultInstance): void {
		const childProcess = this.processMap.get(vault.id);

		if(childProcess) {
			childProcess.kill();
			this.processMap.delete(vault.id);
		}
	}
}			

export const sdUiService = new SDUiService();