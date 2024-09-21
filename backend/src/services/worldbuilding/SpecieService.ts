import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { inject, injectable } from 'inversify';
import { worldSpecies, WorldSpecieSchema } from '../../db/vault/worldBuildingSchema';
import { WorldSpecie } from '../../lib/models/worldbuilding/WorldSpecie';
import { VaultDb } from '../../lib/VaultInstance';
import { VaultService } from '../../lib/VaultService';

@injectable()
export class SpecieService extends VaultService {
	public constructor(@inject('db') db: VaultDb) {
		super(db);
	}

	public async getSpecie(): Promise<WorldSpecie[]> {
		const rawSpecies = await this.db.query.worldSpecies.findMany();
		return rawSpecies.map((specie) => this.mapDBSchema(specie));
	}

	public async getSpecies(id: string): Promise<WorldSpecie> {
		const rawSpecies = await this.db.query.worldSpecies.findFirst({
			where: eq(worldSpecies.id, id)
		});

		if (!rawSpecies) {
			throw new Error('Specie not found');
		}
		return this.mapDBSchema(rawSpecies);
	}

	public async createSpecie(name: string, description: string): Promise<WorldSpecie> {
		const newSpecie = await this.db
			.insert(worldSpecies)
			.values({
				id: randomUUID(),
				name,
				description,
				createdAt: Date.now(),
				updatedAt: Date.now()
			})
			.returning();
		return this.mapDBSchema(newSpecie[0]);
	}

	public async updateSpecie(
		specieId: string,
		name: string,
		description: string
	): Promise<WorldSpecie> {
		const updatedSpecie = await this.db
			.update(worldSpecies)
			.set({
				name,
				description,
				updatedAt: Date.now()
			})
			.where(eq(worldSpecies.id, specieId))
			.returning();
		return this.mapDBSchema(updatedSpecie[0]);
	}

	public async deleteSpecie(specieId: string): Promise<void> {
		await this.db.delete(worldSpecies).where(eq(worldSpecies.id, specieId));
	}

	private mapDBSchema(rawSpecie: WorldSpecieSchema): WorldSpecie {
		return new WorldSpecie(
			rawSpecie.id,
			rawSpecie.name,
			rawSpecie.description ?? '',
			rawSpecie.createdAt,
			rawSpecie.updatedAt
		);
	}
}
