import { inject, injectable } from 'inversify';
import { Route, Router } from '../../../../lib/Router';
import { SpecieService } from '../../../../services/worldbuilding/SpecieService';

@injectable()
export class SpecieRouter extends Router {
	public constructor(@inject(SpecieService) private specieService: SpecieService) {
		super();
	}
	@Route.GET('/species')
	public async getSpecies() {
		return await this.specieService.getSpecie();
	}
}
