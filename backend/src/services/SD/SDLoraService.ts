import { eq } from 'drizzle-orm';
import { inject, injectable } from 'inversify';
import { SDLoraSchema, tagsToLoras } from '../../db/vault/schema';
import { VaultDb } from '../../lib/VaultAPI';
import { VaultService } from '../../lib/VaultService';
import { SDLora } from '../../types/sd/SDLora';
import { PopulatedTag, TagService } from '../TagService';

@injectable()
export class SDLoraService extends VaultService {
	public constructor(
		@inject('db') protected readonly db: VaultDb,
		@inject(TagService) private readonly tagService: TagService
	) {
		super(db);
	}

	public async getLoras(queryTagArr: number[], nameQuery?: string): Promise<SDLora[]> {
		const savedLoras = (await this.db.query.sdLoras.findMany()) as SDLoraSchema[];
		const finalLoraArr: SDLora[] = [];
		for (const savedLora of savedLoras) {
			const tagLoraPairs =
				(await this.db.query.tagsToLoras.findMany({
					where: eq(tagsToLoras.loraId, savedLora.id)
				})) ?? [];
			const tags = await this.tagService.populateTagsById(tagLoraPairs.map(({ tagId }) => tagId));

			if (
				this.matchesTagFilter(queryTagArr ?? [], tags) &&
				this.matchesNameQuery(savedLora.name, nameQuery)
			) {
				finalLoraArr.push({
					...savedLora,
					activationWords: savedLora.activationWords ? JSON.parse(savedLora.activationWords) : [],
					metadata: savedLora.metadata ? JSON.parse(savedLora.metadata) : {},
					tags
				});
			}
		}
		return finalLoraArr;
	}

	private matchesNameQuery = (loraName: string, nameQuery?: string): boolean => {
		if (nameQuery && !loraName.toLowerCase().includes(nameQuery.toLowerCase())) {
			return false;
		}
		return true;
	};

	private matchesTagFilter = (filters: number[], loraTags: PopulatedTag[]): boolean => {
		if (filters.length > 0) {
			for (const tagId of filters) {
				if (!loraTags.find((tag) => tag.id === tagId)) {
					return false;
				}
			}
		}
		return true;
	};
}
