import { FastifyReply, FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { ActiveWatcherSchema } from '../../db/vault/schema';
import { Route, Router } from '../../lib/Router';
import { PageWatcherService } from '../../services/PageWatcherService';

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
