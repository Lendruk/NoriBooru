import { RunningJob } from '$lib/types/RunningJob';
import { pause } from '$lib/utils/time';
import { get } from 'svelte/store';
import { runningJobs, sdUiStatus } from '../../store';
import { HttpService } from './HttpService';

type SDWebsocketEventData = {
	status: 'RUNNING' | 'NOT_RUNNING';
};

type WebSocketEvent = {
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
	public static BASE_WEBSOCKET_URL = `ws://localhost:8080`;
	public static socket: WebSocket | undefined;

	public static registerWebsocket(): void {
		const vaultId = HttpService.getVaultId();
		if (vaultId) {
			WebsocketService.socket = new WebSocket(`${WebsocketService.BASE_WEBSOCKET_URL}`);
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
					await WebsocketService.processWebsocketMessages();
				}
			});

			WebsocketService.socket.addEventListener('close', () => {
				console.log('socket disconnected');
				WebsocketService.socket = undefined;
			});
		}
	}

	private static async processWebsocketMessages() {
		WebsocketService.isProcessingMessage = true;
		const message = WebsocketService.messageQueue.shift()!;
		console.log(message);
		const parsedMessage = JSON.parse(message.data) as WebSocketEvent;
		switch (parsedMessage.event) {
			case 'SD':
				sdUiStatus.set((parsedMessage.data as SDWebsocketEventData).status);
				break;
			case 'current-jobs': {
				runningJobs.set(
					(parsedMessage.data as CurrentJobsEventData).jobs.map(
						(job) => new RunningJob(job.id, job.name, job.tag, job.runtimeData)
					)
				);
				break;
			}
			case 'job-update': {
				const update = parsedMessage.data as JobWebsocketEventData;
				runningJobs.update((jobs) => {
					const index = jobs.findIndex((job) => job.id === update.id);
					if (index !== -1) {
						jobs[index].name = update.name;
						jobs[index].tag = update.tag;
						jobs[index].data = update.payload;
						jobs[index].next({ event: 'job-update', data: update.payload });
					} else {
						jobs.push(new RunningJob(update.id, update.name, update.tag, update.payload));
					}
					return jobs;
				});
				await pause(250);
				break;
			}
			case 'job-done': {
				const jobDoneEvent = parsedMessage.data as JobWebsocketEventData;
				const jobs = get(runningJobs);

				const index = jobs.findIndex((job) => job.id === jobDoneEvent.id);
				if (index !== -1) {
					const job = jobs[index];
					job.next({ event: 'job-done', data: jobDoneEvent.payload });
					jobs.splice(index, 1);
				}

				runningJobs.set(jobs);
				break;
			}
		}

		if (WebsocketService.messageQueue.length > 0) {
			await WebsocketService.processWebsocketMessages();
		}
		WebsocketService.isProcessingMessage = false;
	}
	public static unregisterWebsocket(): void {
		if (WebsocketService.socket) {
			WebsocketService.socket.close();
			WebsocketService.socket = undefined;
		}
	}
}
