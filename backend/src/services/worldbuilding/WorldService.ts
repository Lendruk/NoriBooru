import { randomUUID } from 'crypto';
import { inject, injectable } from 'inversify';
import { world, WorldSchema } from '../../db/vault/worldBuildingSchema';
import { VaultDb } from '../../lib/VaultAPI';
import { VaultService } from '../../lib/VaultService';

@injectable()
export class WorldService extends VaultService {
	public constructor(@inject('db') protected readonly db: VaultDb) {
		super(db);
	}

	public async getWorld(): Promise<WorldSchema> {
		const rawWorld = await this.db.query.world.findFirst();

		if (!rawWorld) {
			throw new Error('World has not been created yet');
		}
		return rawWorld;
	}

	public async createWorld(name: string, description: string): Promise<WorldSchema> {
		const [newWorld] = await this.db
			.insert(world)
			.values({
				createdAt: Date.now(),
				updatedAt: Date.now(),
				id: randomUUID(),
				name,
				description
			})
			.returning();
		return newWorld;
	}

	public async updateWorld(name: string, description: string): Promise<WorldSchema> {
		const [updatedWorld] = await this.db
			.update(world)
			.set({ name, description, updatedAt: Date.now() })
			.returning();
		return updatedWorld;
	}
}
