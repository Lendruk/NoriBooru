export type WorldLocationType = 'settlement' | 'item' | 'character';

export class WorldLocation {
	public constructor(
		public id: string,
		public name: string,
		public description: string,
		public locationType: WorldLocationType,
		public createdAt: number,
		public updatedAt: number,
		public position: { x: number; y: number },
		public layer: string
	) {}
}
