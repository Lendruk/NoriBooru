import { randomUUID } from 'crypto';
import { inject, injectable } from 'inversify';
import { Job, JobAction, JobTag } from '../lib/Job';
import { SDService } from './SD/SDService';
import { WebsocketService } from './WebsocketService';

@injectable()
export class JobService {
	private jobs: Map<string, Job> = new Map();

	public constructor(
		@inject(WebsocketService) private websocketService: WebsocketService,
		@inject(SDService) private sdService: SDService
	) {
		this.websocketService.registerMiddleware((socket) => {
			if (this.jobs.size > 0) {
				this.websocketService.broadcastEvent({
					event: 'current-jobs',
					data: { jobs: Array.from(this.jobs.values()) }
				});
			}
			socket.send(
				JSON.stringify({
					event: 'SD',
					data: { status: this.sdService.isSDServerRunning() ? 'RUNNING' : 'NOT_RUNNING' }
				})
			);
		});
	}

	public async registerJob(job: Job): Promise<void> {
		this.jobs.set(job.id, job);
	}

	public async registerNewJob(
		name: string,
		action: JobAction,
		tag: JobTag,
		repeatEvery?: number
	): Promise<void> {
		const id = randomUUID();
		const newJob: Job = new Job(tag, name, action, repeatEvery);
		this.jobs.set(id, newJob);
	}

	public async runJob(jobId: string): Promise<void> {
		if (this.jobs.has(jobId)) {
			const job = this.jobs.get(jobId)!;
			if (!job.isRunning) {
				job.isRunning = true;
				void this.runWrappedJob(job);
			}
		}
	}

	public async unregisterJob(jobId: string): Promise<void> {
		if (this.jobs.has(jobId)) {
			this.jobs.delete(jobId);
		}
	}

	private async runWrappedJob(job: Job): Promise<void> {
		job.isRunning = true;
		let handler: NodeJS.Timeout | undefined;
		try {
			handler = setInterval(() => {
				if (job.isRunning) {
					this.websocketService.broadcastEvent({
						event: 'job-update',
						data: {
							id: job.id,
							name: job.name,
							tag: job.tag,
							payload: job.runtimeData
						}
					});
				}
			}, job.updateEvery);
			const result = await job.action(job);
			// If the job was cancelled in the meantime, we won't emit a job complete event
			if (job.isRunning) {
				job.isRunning = false;
				clearInterval(handler);
				this.websocketService.broadcastEvent({
					event: 'job-done',
					data: {
						id: job.id,
						result
					}
				});
				this.unregisterJob(job.id);
			}
		} catch (error) {
			this.websocketService.broadcastEvent({
				event: 'job-execution-error',
				data: {
					id: job.id,
					error: (error as Error).message
				}
			});
		} finally {
			if (handler) {
				clearInterval(handler);
			}
			job.isRunning = false;
		}
	}
}
