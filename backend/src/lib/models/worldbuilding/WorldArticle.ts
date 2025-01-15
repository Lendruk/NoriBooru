import { PopulatedTag } from '../../../services/TagService';

export class WorldArticle {
	public constructor(
		public id: string,
		public content: string,
		public createdAt: number,
		public updatedAt: number,
		public tags: PopulatedTag[]
	) {}
}
