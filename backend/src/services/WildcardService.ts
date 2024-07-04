import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { sdWildcards, SDWildcardSchema } from '../db/vault/schema';
import { VaultInstance } from '../db/VaultController';

export type SDWildcard = {
  id: string;
  name: string;
  values: string[];
}

class WildcardService {

	public async getWildcards(vault: VaultInstance): Promise<SDWildcard[]> {
		const { db } = vault;
		const rawWildcards = await db.query.sdWildcards.findMany();
		return this.mapDBSchemas(rawWildcards);
	}
  
	public async updateWildcard(vault: VaultInstance, wildcardId: string, updateBody: { name?: string, values?: string[] }): Promise<SDWildcard> {
		const { db } = vault;
		const updatePayload: Partial<SDWildcardSchema> = {};

		if (updateBody.name) {
			updatePayload.listName = updateBody.name;
		}

		if (Array.isArray(updateBody.values)) {
			updatePayload.values = updateBody.values.join(',');
		}

		const rawWildcard = await db.update(sdWildcards).set(updatePayload).where(eq(sdWildcards.id, wildcardId)).returning();
		return this.mapDBSchema(rawWildcard[0]);
	}
  
	public async createWildcard(vault: VaultInstance, name: string, values: string[]): Promise<SDWildcard> {
		const { db } = vault;
		const newWildcard = await db.insert(sdWildcards).values({ id: randomUUID(), listName: name, values: values.join(',') }).returning();
		return {
			id: newWildcard[0].id,
			name,
			values
		};
	}
  
	public async deleteWildcard(vault: VaultInstance, wildcardId: string): Promise<void> {
		const { db } = vault;
		await db.delete(sdWildcards).where(eq(sdWildcards.id, wildcardId));
	}
  
	private mapDBSchemas(rawWildcards: SDWildcardSchema[]): SDWildcard[] {
		const wildcards: SDWildcard[] = [];

		for (const rawWildcard of rawWildcards) {
			wildcards.push(this.mapDBSchema(rawWildcard));
		}

		return wildcards;
	}

	private mapDBSchema(rawWildcard: SDWildcardSchema): SDWildcard {
		return {
			id: rawWildcard.id,
			name: rawWildcard.listName,
			values: rawWildcard.values.split(','),
		};
	}
}

export default new WildcardService();