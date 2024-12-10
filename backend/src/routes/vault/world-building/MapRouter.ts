import { inject, injectable } from 'inversify';
import { Route, Router } from '../../../lib/Router';
import { MapService } from '../../../services/worldbuilding/MapService';

@injectable()
export class MapRouter extends Router {
	public constructor(@inject(MapService) private readonly mapService: MapService) {
		super();
	}

	@Route.GET('/world-building/maps')
	public async getMaps() {
		return await this.mapService.getMaps();
	}
}
