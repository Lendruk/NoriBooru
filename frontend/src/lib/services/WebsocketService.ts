import { createToast } from '$lib/components/toast/ToastContainer.svelte';
import { runningJobs, sdUiStatus } from '../../store';
import { HttpService } from './HttpService';

type SDWebsocketEventData = {
	status: 'RUNNING' | 'NOT_RUNNING';
};

type WebSocketEvent = {
	event: string;
	data: Record<string, unknown>;
};

type JobWebsocketEventData = {
	jobId: string;
	jobName: string;
	jobTag: string;
	payload: Record<string, unknown>;
};

type JobDoneWebsocketEventData = {
	id: string;
	result: unknown;
};

export class WebsocketService {
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

			WebsocketService.socket.addEventListener('message', (message) => {
				console.log(message.data);
				const parsedMessage = JSON.parse(message.data) as WebSocketEvent;
				if (parsedMessage.event === 'SD') {
					sdUiStatus.set((parsedMessage.data as SDWebsocketEventData).status);
				} else if (parsedMessage.event === 'job-update') {
					const update = parsedMessage.data as JobWebsocketEventData;

					runningJobs.update((jobs) => {
						const index = jobs.findIndex((job) => job.id === update.jobId);
						if (index !== -1) {
							jobs[index].name = update.jobName;
							jobs[index].tag = update.jobTag;
							jobs[index].data = update.payload;
						} else {
							jobs.push({
								id: update.jobId,
								name: update.jobName,
								tag: update.jobTag,
								data: update.payload
							});
						}
						return jobs;
					});
				} else if (parsedMessage.event === 'job-done') {
					const jobDoneEvent = parsedMessage.data as JobDoneWebsocketEventData;
					runningJobs.update((jobs) => {
						const index = jobs.findIndex((job) => job.id === jobDoneEvent.id);
						if (index !== -1) {
							// Messy but will do for now
							const job = jobs[index];
							if (job.tag === 'media-import') {
								createToast('Media uploaded successfully!');
							}
							jobs.splice(index, 1);
						}
						return jobs;
					});
				}
			});

			WebsocketService.socket.addEventListener('close', () => {
				console.log('socket disconnected');
				WebsocketService.socket = undefined;
			});
		}
	}

	public static unregisterWebsocket(): void {
		if (WebsocketService.socket) {
			WebsocketService.socket.close();
			WebsocketService.socket = undefined;
		}
	}
}
