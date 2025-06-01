import { SDWildcard } from '@nori/types/sd/SDWildcard';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { inject } from 'inversify';
import { sdWildcards, SDWildcardSchema } from '../../db/vault/schema';
import { VaultDb } from '../../lib/VaultAPI';
import { VaultService } from '../../lib/VaultService';

export class WildcardService extends VaultService {
	public constructor(@inject('db') db: VaultDb) {
		super(db);
	}

	public async getWildcards(): Promise<SDWildcard[]> {
		const rawWildcards = await this.db.query.sdWildcards.findMany();
		return this.mapDBSchemas(rawWildcards);
	}

	public async updateWildcard(
		wildcardId: string,
		updateBody: { name?: string; values?: string[] }
	): Promise<SDWildcard> {
		const updatePayload: Partial<SDWildcardSchema> = {};

		if (updateBody.name) {
			updatePayload.listName = updateBody.name;
		}

		if (Array.isArray(updateBody.values)) {
			updatePayload.values = updateBody.values.join(',');
		}

		const rawWildcard = await this.db
			.update(sdWildcards)
			.set(updatePayload)
			.where(eq(sdWildcards.id, wildcardId))
			.returning();
		return this.mapDBSchema(rawWildcard[0]);
	}

	public async createWildcard(name: string, values: string[]): Promise<SDWildcard> {
		const newWildcard = await this.db
			.insert(sdWildcards)
			.values({ id: randomUUID(), listName: name, values: values.join(',') })
			.returning();
		return {
			id: newWildcard[0].id,
			name,
			values
		};
	}

	public async deleteWildcard(wildcardId: string): Promise<void> {
		await this.db.delete(sdWildcards).where(eq(sdWildcards.id, wildcardId));
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
			values: rawWildcard.values.split(',')
		};
	}
}
