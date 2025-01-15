import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { inject, injectable } from 'inversify';
import {
	worldLocations,
	worldLocations_to_worldMaps,
	WorldLocationToMapSchema
} from '../../db/vault/worldBuildingSchema';
import { VaultDb } from '../../lib/VaultAPI';
import { VaultService } from '../../lib/VaultService';
import { WorldLocation, WorldLocationType } from '../../lib/models/worldbuilding/WorldLocation';

@injectable()
export class LocationService extends VaultService {
	public constructor(@inject('db') protected readonly db: VaultDb) {
		super(db);
	}

	public async createLocation(
		name: string,
		locationType: WorldLocationType,
		mapId: string,
		layerId: string,
		position: { x: number; y: number },
		sourceId: string,
		description?: string
	): Promise<WorldLocation> {
		const newLocationToMap = await this.db.transaction(async (transaction) => {
			try {
				const [newLocation] = await transaction
					.insert(worldLocations)
					.values({
						createdAt: Date.now(),
						updatedAt: Date.now(),
						id: randomUUID(),
						name,
						locationType,
						sourceId,
						description: description ?? null
					})
					.returning();

				const [newMapLocation] = await transaction
					.insert(worldLocations_to_worldMaps)
					.values({
						locationId: newLocation.id,
						mapId,
						x: position.x,
						y: position.y,
						mapLayer: layerId
					})
					.returning();
				return newMapLocation;
			} catch {
				transaction.rollback();
			}
		});

		if (!newLocationToMap) {
			throw new Error('There was an error during the location creation');
		}

		return await this.mapDbSchema(newLocationToMap);
	}

	public async getMapLocations(mapId: string): Promise<WorldLocation[]> {
		const locationMap = await this.db.query.worldLocations_to_worldMaps.findMany({
			where: eq(worldLocations_to_worldMaps.mapId, mapId)
		});

		return await Promise.all(locationMap.map((location) => this.mapDbSchema(location)));
	}

	private async mapDbSchema(locationToMapSchema: WorldLocationToMapSchema): Promise<WorldLocation> {
		const rawLocation = await this.db.query.worldLocations.findFirst({
			where: eq(worldLocations.id, locationToMapSchema.locationId)
		});

		if (!rawLocation) {
			throw new Error(`Location with id ${locationToMapSchema.locationId} not found`);
		}

		return new WorldLocation(
			rawLocation.id,
			rawLocation.name,
			rawLocation.description ?? '',
			rawLocation.locationType as WorldLocationType,
			rawLocation.createdAt,
			rawLocation.updatedAt,
			{ x: locationToMapSchema.x, y: locationToMapSchema.y },
			locationToMapSchema.mapLayer
		);
	}
}
