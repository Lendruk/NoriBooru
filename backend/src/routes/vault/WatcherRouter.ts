import { FastifyRequest } from 'fastify';
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
}
