import { MediaItemSchema } from '../../../db/vault/schema';
import { WorldCurrency } from './WorldCurrency';

export type ValueModel = {
	currency: WorldCurrency;
	amount: number;
};

export class WorldItem {
	constructor(
		public id: string,
		public name: string,
		public description: string,
		public createdAt: number,
		public updatedAt: number,
		public value: ValueModel[],
		public mediaItems: MediaItemSchema[]
	) {}
}
