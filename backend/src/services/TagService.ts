import { eq, like, sql } from 'drizzle-orm';
import { VaultInstance } from '../db/VaultController';
import { TagSchema, tags } from '../db/vault/schema';

export type SimpleTag = Omit<TagSchema, 'parentTagId'>;
export type PopulatedTag = SimpleTag & { parent: SimpleTag | null, subTags: PopulatedTag[] };

class TagService {
	public async getVaultTags(vault: VaultInstance, nameToQuery?: string): Promise<PopulatedTag[]> {
		const { db } = vault;
		let foundTags: TagSchema[] = [];
		if (nameToQuery) {
			foundTags = await db.query.tags.findMany({ where: like(tags.name, `%${nameToQuery}%`) });
		} else {
			foundTags = await db.query.tags.findMany();
		}  
  
		let finalTags: PopulatedTag[] = [];
		const promises: Promise<PopulatedTag>[] = [];
		for(const tag of foundTags) {
			promises.push(this.populateTag(vault, tag));
		}
		finalTags = await Promise.all(promises);

		return finalTags;
	}

	public async populateTagsById(vault: VaultInstance, tagIds: number[]): Promise<PopulatedTag[]> {
		const { db } = vault;
		let foundTags: TagSchema[] = [];

		foundTags = await db.query.tags.findMany({ where: sql`${tags.id} in (${tagIds.join(',')})` });
		let finalTags: PopulatedTag[] = [];
		const promises: Promise<PopulatedTag>[] = [];
		for(const tag of foundTags) {
			promises.push(this.populateTag(vault, tag));
		}
		finalTags = await Promise.all(promises);

		return finalTags;
	}

	public async createTag(vault: VaultInstance, name: string, color: string, parentId?: number) : Promise<SimpleTag> {
		const { db } = vault;
		const newTag = (await db.insert(tags).values({ name: name, color: color, parentTagId: parentId }).returning())[0];
		return newTag as TagSchema;
	}

	public async deleteTag(vault: VaultInstance, tagId: number): Promise<void> {
		const { db } = vault;
		await db.delete(tags).where(eq(tags.id, tagId));
	}

	public async updateTag(vault: VaultInstance, tagId: number, updatePayload: { name?: string, parentTagId?: number, color: string }): Promise<SimpleTag> {
		const { db } = vault;
		const updated = (await db.update(tags)
			.set({ ...updatePayload })
			.where(eq(tags.id, tagId)).returning())[0];

		return updated;
	}

	private populateTag = async (vaultInstance: VaultInstance, tag: TagSchema): Promise<PopulatedTag> => {
		let parentTag: SimpleTag | null = null;
		if (tag.parentTagId) {
			const result = await vaultInstance.db.query.tags.findFirst({ where: eq(tags.id, tag.parentTagId) });
			if (result) {
				parentTag = {
					color: result.color,
					id: result.id,
					mediaCount: result.mediaCount,
					name: result.name,
				};
			}
		}
  
		let subTags: PopulatedTag[] = [];
		const foundSubTags = await vaultInstance.db.query.tags.findMany({ where: eq(tags.parentTagId, tag.id)});
		if (foundSubTags) {
			const promises: Promise<PopulatedTag>[] = [];
			for(const subTag of foundSubTags) {
				promises.push(this.populateTag(vaultInstance, subTag));
			}
			subTags = await Promise.all(promises);
		}
  
		return {
			color: tag.color,
			id: tag.id,
			mediaCount: tag.mediaCount,
			name: tag.name,
			parent: parentTag,
			subTags
		};
	};
}
 
export default new TagService();