import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { inject, injectable } from 'inversify';
import { worldCharacters, WorldCharacterSchema } from '../../db/vault/worldBuildingSchema';
import { VaultDb } from '../../lib/VaultAPI';
import { VaultService } from '../../lib/VaultService';
import { WorldCharacter } from '../../lib/models/worldbuilding/WorldCharacter';
import { CultureService } from './CultureService';
import { SpecieService } from './SpecieService';

@injectable()
export class CharacterService extends VaultService {
	public constructor(
		@inject('db') db: VaultDb,
		@inject(SpecieService) private specieService: SpecieService,
		@inject(CultureService) private cultureService: CultureService
	) {
		super(db);
	}

	public async getCharacters(): Promise<WorldCharacter[]> {
		const rawCharacters = await this.db.query.worldCharacters.findMany();
		const characters: WorldCharacter[] = [];
		for (const rawCharacter of rawCharacters) {
			characters.push(await this.mapDBSchema(rawCharacter));
		}
		return characters;
	}

	public async getCharacter(id: string): Promise<WorldCharacter> {
		const rawCharacter = await this.db.query.worldCharacters.findFirst({
			where: eq(worldCharacters.id, id)
		});

		if (!rawCharacter) {
			throw new Error('Character not found');
		}

		return await this.mapDBSchema(rawCharacter);
	}

	public async createCharacter(
		name: string,
		age: number,
		specieId?: string,
		cultureId?: string
	): Promise<WorldCharacter> {
		const newCharacter = await this.db
			.insert(worldCharacters)
			.values({
				id: randomUUID(),
				name,
				age,
				createdAt: Date.now(),
				updatedAt: Date.now(),
				specieId,
				cultureId
			})
			.returning();

		return await this.mapDBSchema(newCharacter[0]);
	}

	public async updateCharacter(
		characterId: string,
		name: string,
		age: number,
		specieId?: string,
		cultureId?: string
	): Promise<WorldCharacter> {
		const updatedCharacter = await this.db
			.update(worldCharacters)
			.set({
				name,
				age,
				updatedAt: Date.now(),
				specieId,
				cultureId
			})
			.where(eq(worldCharacters.id, characterId))
			.returning();

		return await this.mapDBSchema(updatedCharacter[0]);
	}

	public async deleteCharacter(characterId: string): Promise<void> {
		await this.db.delete(worldCharacters).where(eq(worldCharacters.id, characterId));
	}

	private async mapDBSchema(rawCharacter: WorldCharacterSchema): Promise<WorldCharacter> {
		return new WorldCharacter(
			rawCharacter.id,
			rawCharacter.name,
			rawCharacter.age,
			rawCharacter.createdAt,
			rawCharacter.updatedAt,
			rawCharacter.specieId
				? await this.specieService.getSpecies(rawCharacter.specieId)
				: undefined,
			rawCharacter.cultureId
				? await this.cultureService.getCulture(rawCharacter.cultureId)
				: undefined
		);
	}
}
