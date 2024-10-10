import { eq, like } from 'drizzle-orm';
import fs from 'fs/promises';
import { inject, injectable } from 'inversify';
import { sdCheckpoints, SDCheckpointSchema } from '../../db/vault/schema';
import { VaultDb } from '../../lib/VaultAPI';
import { VaultService } from '../../lib/VaultService';

@injectable()
export class SDCheckpointService extends VaultService {
	public constructor(@inject('db') db: VaultDb) {
		super(db);
	}

	public async getSDCheckpoints(nameQuery?: string): Promise<SDCheckpointSchema[]> {
		if (nameQuery) {
			return await this.db
				.select()
				.from(sdCheckpoints)
				.where(like(sdCheckpoints.name, `%${nameQuery}%`));
		}
		return await this.db.query.sdCheckpoints.findMany();
	}

	public async deleteCheckpoint(id: string): Promise<void> {
		const checkpoint = await this.db.query.sdCheckpoints.findFirst({
			where: eq(sdCheckpoints.id, id)
		});
		if (checkpoint) {
			await fs.unlink(checkpoint.path);
			await this.db.delete(sdCheckpoints).where(eq(sdCheckpoints.id, id));
		}
	}
}
