import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { inject, injectable } from 'inversify';
import { worldCultures, WorldCultureSchema } from '../../db/vault/worldBuildingSchema';
import { VaultDb } from '../../lib/VaultInstance';
import { VaultService } from '../../lib/VaultService';
import { WorldCulture } from '../../lib/models/worldbuilding/WorldCulture';

@injectable()
export class CultureService extends VaultService {
	public constructor(@inject('db') db: VaultDb) {
		super(db);
	}

	public async getCultures(): Promise<WorldCulture[]> {
		const rawCultures = await this.db.query.worldCultures.findMany();
		return rawCultures.map((culture) => this.mapDBSchema(culture));
	}

	public async getCulture(id: string): Promise<WorldCulture> {
		const rawCulture = await this.db.query.worldCultures.findFirst({
			where: eq(worldCultures.id, id)
		});

		if (!rawCulture) {
			throw new Error('Culture not found');
		}
		return this.mapDBSchema(rawCulture);
	}

	public async createCulture(name: string, description: string): Promise<WorldCulture> {
		const newCulture = await this.db
			.insert(worldCultures)
			.values({
				id: randomUUID(),
				name,
				description,
				createdAt: Date.now(),
				updatedAt: Date.now()
			})
			.returning();
		return this.mapDBSchema(newCulture[0]);
	}

	public async updateCulture(
		cultureId: string,
		name: string,
		description: string
	): Promise<WorldCulture> {
		const updatedCulture = await this.db
			.update(worldCultures)
			.set({
				name,
				description,
				updatedAt: Date.now()
			})
			.where(eq(worldCultures.id, cultureId))
			.returning();
		return this.mapDBSchema(updatedCulture[0]);
	}

	public async deleteCulture(cultureId: string): Promise<void> {
		await this.db.delete(worldCultures).where(eq(worldCultures.id, cultureId));
	}

	private mapDBSchema(rawCulture: WorldCultureSchema): WorldCulture {
		return new WorldCulture(
			rawCulture.id,
			rawCulture.name,
			rawCulture.description ?? '',
			rawCulture.createdAt,
			rawCulture.updatedAt
		);
	}
}
