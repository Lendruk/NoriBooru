import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { inject, injectable } from 'inversify';
import {
	worldArticles,
	worldArticles_to_tags,
	WorldArticleSchema
} from '../../db/vault/worldBuildingSchema';
import { VaultDb } from '../../lib/VaultAPI';
import { VaultService } from '../../lib/VaultService';
import { WorldArticle } from '../../lib/models/worldbuilding/WorldArticle';
import { TagService } from '../TagService';

@injectable()
export class ArticleService extends VaultService {
	public constructor(
		@inject('db') protected readonly db: VaultDb,
		@inject(TagService) private readonly tagService: TagService
	) {
		super(db);
	}

	public async getArticles(): Promise<WorldArticle[]> {
		const rawArticles = await this.db.query.worldArticles.findMany();
		return await Promise.all(rawArticles.map((article) => this.mapDbSchema(article)));
	}

	public async getArticle(id: string): Promise<WorldArticle> {
		const rawArticle = await this.db.query.worldArticles.findFirst({
			where: eq(worldArticles.id, id)
		});

		if (!rawArticle) {
			throw new Error(`Article with id ${id} not found`);
		}

		return await this.mapDbSchema(rawArticle);
	}

	public async createArticle(content: string, tags: number[]): Promise<WorldArticle> {
		const newArticle = await this.db.transaction(async (transaction) => {
			try {
				const [newArticle] = await transaction
					.insert(worldArticles)
					.values({ content, createdAt: Date.now(), updatedAt: Date.now(), id: randomUUID() })
					.returning();

				for (const tagId of tags) {
					await transaction
						.insert(worldArticles_to_tags)
						.values({ worldArticleId: newArticle.id, tagId });
				}
				return newArticle;
			} catch {
				transaction.rollback();
			}
		});

		if (!newArticle) {
			throw new Error('There was an error during the article creation');
		}

		return await this.mapDbSchema(newArticle);
	}

	public async updateArticle(id: string, content: string, tags: number[]): Promise<WorldArticle> {
		const article = await this.db.transaction(async (transaction) => {
			try {
				const [newArticle] = await transaction
					.update(worldArticles)
					.set({ content, updatedAt: Date.now() })
					.where(eq(worldArticles.id, id))
					.returning();

				for (const tagId of tags) {
					await transaction
						.insert(worldArticles_to_tags)
						.values({ worldArticleId: newArticle.id, tagId });
				}

				return newArticle;
			} catch {
				transaction.rollback();
			}
		});

		if (!article) {
			throw new Error('There was an error during the article update');
		}

		return await this.mapDbSchema(article);
	}

	public async deleteArticle(id: string): Promise<void> {
		await this.db.delete(worldArticles).where(eq(worldArticles.id, id));
	}

	private async mapDbSchema(rawArticle: WorldArticleSchema): Promise<WorldArticle> {
		const tagIds = await this.db.query.worldArticles_to_tags.findMany({
			where: eq(worldArticles_to_tags.worldArticleId, rawArticle.id)
		});

		return new WorldArticle(
			rawArticle.id,
			rawArticle.content,
			rawArticle.createdAt,
			rawArticle.updatedAt,
			await this.tagService.populateTagsById(tagIds.map((t) => t.tagId))
		);
	}
}
