import { RunningJob } from '$lib/types/RunningJob';
import { get } from 'svelte/store';
import { runningJobs, sdUiStatus, socketEvents$ } from '../../store';
import { HttpService } from './HttpService';

type SDWebsocketEventData = {
	status: 'RUNNING' | 'NOT_RUNNING';
};

export type WebSocketEvent = {
	event: string;
	data: Record<string, unknown>;
};

export type JobWebsocketEventData<T = Record<string, unknown>> = {
	event: 'job-update' | 'job-done' | 'job-execution-error';
	id: string;
	name: string;
	tag: string;
	payload: T;
};

type CurrentJobsEventData = {
	jobs: {
		id: string;
		name: string;
		tag: string;
		runtimeData: Record<string, unknown>;
	}[];
};

export class WebsocketService {
	private static isProcessingMessage = false;
	private static messageQueue: MessageEvent[] = [];
	public static BASE_WEBSOCKET_URL = `ws://localhost`;
	public static socket: WebSocket | undefined;

	public static async registerWebsocket(): Promise<void> {
		const vaultId = HttpService.getVaultId();
		let port = HttpService.getVaultPort();
		if (vaultId) {
			if (!port) {
				port = await HttpService.refreshPort();
			}

			WebsocketService.socket = new WebSocket(`${WebsocketService.BASE_WEBSOCKET_URL}:${port}/ws`);
			WebsocketService.socket.addEventListener('open', () => {
				console.log('socket connected');
				WebsocketService.socket!.send(
					JSON.stringify({ type: 'register', data: { vault: vaultId } })
				);
			});

			WebsocketService.socket.addEventListener('message', async (message) => {
				WebsocketService.messageQueue.push(message);
				if (!WebsocketService.isProcessingMessage) {
					WebsocketService.isProcessingMessage = true;
					while (WebsocketService.messageQueue.length > 0) {
						await WebsocketService.processWebsocketMessages();
					}
					WebsocketService.isProcessingMessage = false;
				}
			});

			WebsocketService.socket.addEventListener('close', () => {
				console.log('socket disconnected');
				WebsocketService.socket = undefined;
			});
		}
	}

	private static async processWebsocketMessages() {
		const message = WebsocketService.messageQueue.shift()!;
		const parsedMessage = JSON.parse(message.data) as WebSocketEvent;
		socketEvents$.set(parsedMessage);
		let runningJobsCopy = get(runningJobs);
		switch (parsedMessage.event) {
			case 'SD':
				sdUiStatus.set((parsedMessage.data as SDWebsocketEventData).status);
				break;
			case 'current-jobs': {
				runningJobsCopy = (parsedMessage.data as CurrentJobsEventData).jobs.map(
					(job) => new RunningJob(job.id, job.name, job.tag, job.runtimeData)
				);

				break;
			}
			case 'job-update': {
				const update = parsedMessage.data as JobWebsocketEventData;
				const index = runningJobsCopy.findIndex((job) => job.id === update.id);
				if (index !== -1) {
					runningJobsCopy[index].name = update.name;
					runningJobsCopy[index].tag = update.tag;
					runningJobsCopy[index].data = update.payload;
					runningJobsCopy[index].next({ event: 'job-update', data: update.payload });
				} else {
					runningJobsCopy.push(new RunningJob(update.id, update.name, update.tag, update.payload));
				}
				break;
			}
			case 'job-done': {
				const jobDoneEvent = parsedMessage.data as JobWebsocketEventData;

				const index = runningJobsCopy.findIndex((job) => job.id === jobDoneEvent.id);
				if (index !== -1) {
					const job = runningJobsCopy.splice(index, 1)[0];
					job.next({ event: 'job-done', data: jobDoneEvent.payload });
				}
				break;
			}
		}

		runningJobs.set(runningJobsCopy);
	}
	public static unregisterWebsocket(): void {
		if (WebsocketService.socket) {
			WebsocketService.socket.close();
			WebsocketService.socket = undefined;
		}
	}
}
