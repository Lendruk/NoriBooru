import { Subject } from 'rxjs';

export class RunningJob<T> extends Subject<T> {
	id: string;
	name: string;
	tag: string;
	data: Record<string, unknown>;

	public constructor(id: string, name: string, tag: string, data: Record<string, unknown>) {
		super();
		this.id = id;
		this.name = name;
		this.tag = tag;
		this.data = data;
	}
}
