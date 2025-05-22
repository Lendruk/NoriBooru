import { eq, like, sql } from 'drizzle-orm';
import { inject, injectable } from 'inversify';
import { TagSchema, tags } from '../db/vault/schema';
import { VaultDb } from '../lib/VaultAPI';
import { VaultService } from '../lib/VaultService';
import { generateRandomColor } from '../utils/generateRandomColor';

export type SimpleTag = Omit<TagSchema, 'parentTagId'>;
export type PopulatedTag = SimpleTag & {
	parent: SimpleTag | null;
	subTags: PopulatedTag[];
};

@injectable()
export class TagService extends VaultService {
	public constructor(@inject('db') db: VaultDb) {
		super(db);
	}

	public async getTag(id: number): Promise<PopulatedTag> {
		const dbTag = await this.db.query.tags.findFirst({ where: eq(tags.id, id) });

		if (!dbTag) {
			throw new Error(`Error while fetching tag, tag with id ${id} not found`);
		}

		return this.populateTag(dbTag);
	}

	public async doesTagExist(tagName: string): Promise<boolean> {
		const dbTag = await this.db.query.tags.findFirst({
			where: like(tags.name, tagName.trim().replaceAll(' ', '_').toLowerCase())
		});
		return !!dbTag;
	}

	public async getTagByName(tagName: string): Promise<SimpleTag | undefined> {
		const dbTag = await this.db.query.tags.findFirst({
			where: like(tags.name, tagName.trim().replaceAll(' ', '_').toLowerCase())
		});
		return dbTag;
	}

	public async getAllTags(nameToQuery?: string): Promise<PopulatedTag[]> {
		let foundTags: TagSchema[] = [];
		if (nameToQuery) {
			foundTags = await this.db.query.tags.findMany({
				where: like(tags.name, `%${nameToQuery}%`)
			});
		} else {
			foundTags = await this.db.query.tags.findMany();
		}

		let finalTags: PopulatedTag[] = [];
		const promises: Promise<PopulatedTag>[] = [];
		for (const tag of foundTags) {
			promises.push(this.populateTag(tag));
		}
		finalTags = await Promise.all(promises);

		return finalTags;
	}

	public async populateTagsById(tagIds: number[]): Promise<PopulatedTag[]> {
		let foundTags: TagSchema[] = [];

		foundTags = await this.db.query.tags.findMany({
			where: sql`${tags.id} in (${tagIds.join(',')})`
		});
		let finalTags: PopulatedTag[] = [];
		const promises: Promise<PopulatedTag>[] = [];
		for (const tag of foundTags) {
			promises.push(this.populateTag(tag));
		}
		finalTags = await Promise.all(promises);

		return finalTags;
	}

	public async createTag(name: string, color: string, parentId?: number): Promise<SimpleTag> {
		const formattedTagName = name.trim().replaceAll(' ', '_').toLowerCase();

		if (formattedTagName.length === 0) {
			throw new Error('Tag name cannot be empty');
		}

		const newTag = (
			await this.db
				.insert(tags)
				.values({
					name: formattedTagName,
					color: color === '#ffffff' ? generateRandomColor() : color,
					parentTagId: parentId
				})
				.returning()
		)[0];
		return this.populateTag(newTag);
	}

	public async deleteTag(tagId: number): Promise<void> {
		await this.db.delete(tags).where(eq(tags.id, tagId));
	}

	public async updateTag(
		tagId: number,
		updatePayload: { name?: string; parentId?: number; color: string }
	): Promise<SimpleTag> {
		const updated = (
			await this.db
				.update(tags)
				.set({ ...updatePayload, parentTagId: updatePayload.parentId ?? null })
				.where(eq(tags.id, tagId))
				.returning()
		)[0];

		return updated;
	}

	private populateTag = async (tag: TagSchema): Promise<PopulatedTag> => {
		let parentTag: SimpleTag | null = null;
		if (tag.parentTagId) {
			const result = await this.db.query.tags.findFirst({
				where: eq(tags.id, tag.parentTagId)
			});
			if (result) {
				parentTag = {
					color: result.color,
					id: result.id,
					name: result.name
				};
			}
		}

		let subTags: PopulatedTag[] = [];
		const foundSubTags = await this.db.query.tags.findMany({
			where: eq(tags.parentTagId, tag.id)
		});
		if (foundSubTags) {
			const promises: Promise<PopulatedTag>[] = [];
			for (const subTag of foundSubTags) {
				promises.push(this.populateTag(subTag));
			}
			subTags = await Promise.all(promises);
		}

		return {
			color: tag.color,
			id: tag.id,
			name: tag.name,
			parent: parentTag,
			subTags
		};
	};
}
