import { randomUUID } from 'crypto';

export type JobTag = 'media-import' | 'civitai-import' | 'misc';

export type JobAction = (emitter: Job) => Promise<unknown>;

export class Job {
	public id: string;
	public name: string;
	public action: JobAction;
	public isRunning: boolean;
	public tag: JobTag;
	public repeatEvery?: number;
	public updateEvery: number = 1000;

	public runtimeData?: Record<string, unknown>;

	constructor(tag: JobTag, name: string, action: JobAction, repeatEvery?: number) {
		this.id = randomUUID();
		this.name = name;
		this.action = action;
		this.isRunning = false;
		this.tag = tag;
		this.repeatEvery = repeatEvery;
	}

	public setData(data: Record<string, unknown>): void {
		this.runtimeData = data;
	}
}
