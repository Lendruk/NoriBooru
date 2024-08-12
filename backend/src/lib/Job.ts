import { randomUUID } from 'crypto';
import EventEmitter from 'events';

export type JobTag = 'media-import' | 'civitai-import' | 'misc';

export type JobAction = (emitter: EventEmitter) => Promise<unknown>;

export class Job extends EventEmitter {
	public id: string;
	public name: string;
	public action: JobAction;
	public isRunning: boolean;
	public tag: JobTag;
	public repeatEvery?: number;

	public runtimeData?: Record<string, unknown>;

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
