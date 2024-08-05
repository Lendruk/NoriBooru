import { randomUUID } from 'crypto';
import EventEmitter from 'events';

type JobTag = 'media-import' | 'misc';

export type JobAction = (emitter: EventEmitter) => Promise<unknown>;

export class Job extends EventEmitter {
	public id: string;
	public name: string;
	public action: JobAction;
	public isRunning: boolean;
	public tag: JobTag;
	public repeatEvery?: number;

	constructor(tag: JobTag, name: string, action: JobAction, repeatEvery?: number) {
		super();
		this.id = randomUUID();
		this.name = name;
		this.action = action;
		this.isRunning = false;
		this.tag = tag;
		this.repeatEvery = repeatEvery;
	}
}

/**
 * Job service for managing background jobs
 */
export class JobService {
	private jobs: Map<string, Job> = new Map();
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

	public isJobRunning(jobId: string): boolean {
		return this.jobs.get(jobId)?.isRunning ?? false;
	}

	public async unregisterJob(jobId: string): Promise<void> {
		if (this.jobs.has(jobId)) {
			this.jobs.delete(jobId);
		}
	}

	private async runWrappedJob(job: Job): Promise<void> {
		job.isRunning = true;

		try {
			const result = await job.action(job);
			console.log(job.isRunning);
			// If the job was cancelled in the meantime, we won't emit a job complete event
			if (job.isRunning) {
				job.emit('job-done', { id: job.id, result });
				this.unregisterJob(job.id);
			}
		} catch (error) {
			job.emit('job-execution-error', { id: job.id, error: (error as Error).message });
		}

		job.isRunning = false;
	}
}
