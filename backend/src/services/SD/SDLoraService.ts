import { randomUUID } from 'crypto';
import { eq, sql } from 'drizzle-orm';
import fs from 'fs/promises';
import { inject, injectable } from 'inversify';
import { MediaItemSchema, sdLoras, SDLoraSchema, tagsToLoras } from '../../db/vault/schema';
import { VaultDb } from '../../lib/VaultAPI';
import { VaultService } from '../../lib/VaultService';
import { SDLora } from '../../types/sd/SDLora';
import { MediaService } from '../MediaService';
import { PopulatedTag, TagService } from '../TagService';

export type UpdateLoraOptions = {
	name?: string;
	tags?: number[];
	description?: string;
	sdVersion?: string;
	origin?: string;
	previewMediaItem?: number;
	activationWords?: string[];
};

export type CreateLoraOptions = UpdateLoraOptions & {
	path: string;
};

@injectable()
export class SDLoraService extends VaultService {
	public constructor(
		@inject('db') protected readonly db: VaultDb,
		@inject(TagService) private readonly tagService: TagService,
		@inject(MediaService) private readonly mediaService: MediaService
	) {
		super(db);
	}

	public async createLora(options: CreateLoraOptions): Promise<SDLoraSchema> {
		const { name, description, sdVersion, origin, previewMediaItem, path } = options;
		const newLora = await this.db
			.insert(sdLoras)
			.values({
				id: randomUUID(),
				name: name ?? '',
				previewMediaItem: previewMediaItem ?? null,
				origin: origin ?? '',
				description: description ?? 'unknown',
				sdVersion: sdVersion ?? '',
				path: path,
				activationWords: JSON.stringify(options.activationWords ?? [])
			})
			.returning();
		return newLora[0];
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
				let mediaItem: MediaItemSchema | undefined;
				if (savedLora.previewMediaItem) {
					mediaItem = await this.mediaService.getMediaItem(savedLora.previewMediaItem);
				}

				finalLoraArr.push({
					...savedLora,
					previewMediaItem: mediaItem,
					activationWords: savedLora.activationWords ? JSON.parse(savedLora.activationWords) : [],
					metadata: savedLora.metadata ? JSON.parse(savedLora.metadata) : {},
					tags
				});
			}
		}
		return finalLoraArr;
	}

	public async getLora(id: string): Promise<SDLoraSchema> {
		const lora = await this.db.query.sdLoras.findFirst({
			where: eq(sdLoras.id, id)
		});

		if (!lora) {
			throw new Error(`Lora with id ${id} not found`);
		}

		return lora;
	}

	public async updateLora(id: string, options: UpdateLoraOptions): Promise<SDLoraSchema> {
		const updatePayload: Record<string, unknown> = {};

		for (const key in options) {
			if (['name', 'previewMediaItem', 'origin', 'description', 'sdVersion'].includes(key)) {
				updatePayload[key] = options[key as keyof typeof options];
			}
		}

		if (Object.keys(updatePayload).length > 0) {
			await this.db
				.update(sdLoras)
				.set({ ...updatePayload })
				.where(eq(sdLoras.id, id));
		}
		const currentTags = (
			await this.db.query.tagsToLoras.findMany({ where: eq(tagsToLoras.loraId, id) })
		).map(({ tagId }) => tagId);
		const tagsToRemove: number[] = [];
		const tagsToAdd: number[] = [];

		if (options.tags !== undefined && Array.isArray(options.tags)) {
			for (const tagId of currentTags) {
				if (!options.tags.find((tag) => tagId === tag)) {
					tagsToRemove.push(tagId);
				}
			}

			for (const tagId of options.tags) {
				if (!currentTags.find((tag) => tagId === tag)) {
					tagsToAdd.push(tagId);
				}
			}

			if (tagsToRemove.length > 0) {
				await this.db
					.delete(tagsToLoras)
					.where(sql`${tagsToLoras.tagId} in (${tagsToRemove.join(',')})`);
			}

			if (tagsToAdd.length > 0) {
				console.log(tagsToAdd);
				await this.db
					.insert(tagsToLoras)
					.values(tagsToAdd.map((tag) => ({ loraId: id, tagId: tag })));
			}
		}

		return await this.getLora(id);
	}

	public async deleteLora(loraId: string): Promise<void> {
		const lora = await this.db.query.sdLoras.findFirst({ where: eq(sdLoras.id, loraId) });
		if (lora) {
			await fs.unlink(lora.path);
			await this.db.delete(sdLoras).where(eq(sdLoras.id, loraId));
		}
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
