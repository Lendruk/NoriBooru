import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { inject, injectable } from 'inversify';
import { worldMaps, WorldMapSchema } from '../../db/vault/worldBuildingSchema';
import { VaultDb } from '../../lib/VaultAPI';
import { VaultService } from '../../lib/VaultService';
import { WorldMap } from '../../lib/models/worldbuilding/WorldMap';

@injectable()
export class MapService extends VaultService {
	public constructor(@inject('db') protected readonly db: VaultDb) {
		super(db);
	}

	public async getMaps(): Promise<WorldMap[]> {
		const rawMaps = await this.db.query.worldMaps.findMany();
		return rawMaps.map((map) => this.mapDbSchema(map));
	}

	public async createMap(name: string, description?: string): Promise<WorldMap> {
		const newMap = await this.db
			.insert(worldMaps)
			.values({
				createdAt: Date.now(),
				updatedAt: Date.now(),
				id: randomUUID(),
				name,
				description
			})
			.returning();
		return this.mapDbSchema(newMap[0]);
	}

	public async updateMap(id: string, name: string, description?: string): Promise<WorldMap> {
		const updatedMap = await this.db
			.update(worldMaps)
			.set({ name, description, updatedAt: Date.now() })
			.where(eq(worldMaps.id, id))
			.returning();
		return this.mapDbSchema(updatedMap[0]);
	}

	public async deleteMap(id: string): Promise<void> {
		await this.db.delete(worldMaps).where(eq(worldMaps.id, id));
	}

	private mapDbSchema(rawMap: WorldMapSchema): WorldMap {
		return new WorldMap(
			rawMap.id,
			rawMap.name,
			rawMap.description ?? '',
			rawMap.createdAt,
			rawMap.updatedAt
		);
	}
}
