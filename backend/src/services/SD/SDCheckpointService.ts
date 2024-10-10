import { eq, like } from 'drizzle-orm';
import fs from 'fs/promises';
import { inject, injectable } from 'inversify';
import { sdCheckpoints, SDCheckpointSchema } from '../../db/vault/schema';
import { VaultDb } from '../../lib/VaultAPI';
import { VaultService } from '../../lib/VaultService';

export type UpdateCheckpointRequest = {
	name?: string;
	tags?: number[];
	sdVersion?: string;
	description?: string;
	origin?: string;
	previewImage?: string;
};

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

	public async getCheckpoint(id: string): Promise<SDCheckpointSchema> {
		const checkpoint = await this.db.query.sdCheckpoints.findFirst({
			where: eq(sdCheckpoints.id, id)
		});

		if (!checkpoint) {
			throw new Error(`Checkpoint with id ${id} not found`);
		}

		return checkpoint;
	}

	public async updateCheckpoint(
		id: string,
		options: UpdateCheckpointRequest
	): Promise<SDCheckpointSchema> {
		const updatePayload: Record<string, unknown> = {};
		for (const key in options) {
			if (['name', 'previewImage', 'origin', 'description', 'sdVersion'].includes(key)) {
				updatePayload[key] = options[key as keyof typeof options];
			}

			if (Object.keys(updatePayload).length > 0) {
				await this.db
					.update(sdCheckpoints)
					.set({ ...updatePayload })
					.where(eq(sdCheckpoints.id, id));
			}
		}
		return await this.getCheckpoint(id);
	}
}
