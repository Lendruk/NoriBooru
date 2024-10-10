import { FastifyReply, FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { ActiveWatcherSchema } from '../../db/vault/schema';
import { Route, Router } from '../../lib/Router';
import { PageWatcherService } from '../../services/PageWatcherService';

type CreateWatcherRequestBody = {
	url?: string;
	description?: string;
	requestInterval: number;
	itemsPerRequest: number;
	inactivityTimeout: number;
};

type UpdateWatcherRequestBody = {
	description?: string;
	requestInterval: number;
	itemsPerRequest: number;
	inactivityTimeout: number;
};

@injectable()
export class WatcherRouter extends Router {
	public constructor(@inject(PageWatcherService) private watcherService: PageWatcherService) {
		super();
	}

	@Route.GET('/watchers')
	public async getWatchers(): Promise<ActiveWatcherSchema[]> {
		return await this.watcherService.getWatchers().sort((a, b) => b.createdAt - a.createdAt);
	}

	@Route.GET('/watchers/:id')
	public async getWatcher(request: FastifyRequest): Promise<ActiveWatcherSchema> {
		const { id } = request.params as { id: string };
		return await this.watcherService.getWatcher(id);
	}

	@Route.POST('/watchers')
	public async createWatcher(request: FastifyRequest, reply: FastifyReply) {
		const body = request.body as CreateWatcherRequestBody;

		if (!body?.url) {
			return reply.status(400).send('No url provided');
		}
		const watcher = await this.watcherService.createWatcher(
			body.url,
			body.description ?? '',
			body.requestInterval,
			body.itemsPerRequest,
			body.inactivityTimeout
		);
		return watcher.toSchema();
	}

	@Route.PUT('/watchers/:id')
	public async updateWatcher(request: FastifyRequest) {
		const { id } = request.params as { id: string };
		const body = request.body as UpdateWatcherRequestBody;
		const watcher = await this.watcherService.updateWatcher(
			id,
			body.description ?? '',
			body.requestInterval,
			body.itemsPerRequest,
			body.inactivityTimeout
		);
		return watcher.toSchema();
	}

	@Route.DELETE('/watchers/:id')
	public async deleteWatcher(request: FastifyRequest) {
		const { id } = request.params as { id: string };
		await this.watcherService.deleteWatcher(id);
	}

	@Route.PATCH('/watchers/:id/resume')
	public async resumeWathcer(request: FastifyRequest, reply: FastifyReply) {
		const { id } = request.params as { id: string };
		this.watcherService.resumeWatcher(id);
		return reply.send({ message: 'Watcher resumed successfully' });
	}

	@Route.PATCH('/watchers/:id/pause')
	public async pauseWatcher(request: FastifyRequest, reply: FastifyReply) {
		const { id } = request.params as { id: string };
		this.watcherService.pauseWatcher(id);
		return reply.send({ message: 'Watcher paused successfully' });
	}
}
