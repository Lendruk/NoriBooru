import { eq } from 'drizzle-orm';
import { inject, injectable } from 'inversify';
import { randomUUID } from 'node:crypto';
import { MediaItemSchema } from '../../db/vault/schema';
import {
	worldItems,
	worldItems_to_mediaItems,
	worldItems_to_worldCurrencies,
	WorldItemSchema,
	WorldItemToCurrencySchema,
	WorldItemToMediaItemSchema
} from '../../db/vault/worldBuildingSchema';
import { VaultDb } from '../../lib/VaultAPI';
import { VaultService } from '../../lib/VaultService';
import { ValueModel, WorldItem } from '../../lib/models/worldbuilding/WorldItem';
import { MediaService } from '../MediaService';
import { CurrencyService } from './CurrencyService';

@injectable()
export class ItemService extends VaultService {
	public constructor(
		@inject('db') db: VaultDb,
		@inject(CurrencyService) private currencyService: CurrencyService,
		@inject(MediaService) private mediaService: MediaService
	) {
		super(db);
	}

	public async getItems(): Promise<WorldItem[]> {
		const rawItems = await this.db.query.worldItems.findMany();
		const mappedItems: WorldItem[] = [];
		for (const rawItem of rawItems) {
			mappedItems.push(await this.mapDbSchema(rawItem));
		}
		return mappedItems;
	}

	public async createItem(
		name: string,
		description: string,
		mediaItems: number[],
		values: { currencyId: string; amount: number }[]
	): Promise<WorldItem> {
		const item = await this.db.transaction(async (transaction) => {
			try {
				const [newItem] = await transaction
					.insert(worldItems)
					.values({
						createdAt: Date.now(),
						updatedAt: Date.now(),
						id: randomUUID(),
						name,
						description
					})
					.returning();

				for (const mediaItemId of mediaItems) {
					await transaction.insert(worldItems_to_mediaItems).values({
						worldItemId: newItem.id,
						mediaItemId
					});
				}

				for (const value of values) {
					await transaction.insert(worldItems_to_worldCurrencies).values({
						worldItemId: newItem.id,
						worldCurrencyId: value.currencyId,
						amount: value.amount
					});
				}

				return newItem;
			} catch {
				transaction.rollback();
			}
		});

		if (!item) {
			throw new Error('There was an error during the item creation');
		}

		return await this.mapDbSchema(item);
	}

	public async updateItem(
		id: string,
		name: string,
		description: string,
		mediaItems: number[],
		values: { currencyId: string; amount: number }[]
	): Promise<WorldItem> {
		const item = await this.db.transaction(async (transaction) => {
			try {
				const [newItem] = await transaction
					.update(worldItems)
					.set({
						updatedAt: Date.now(),
						name,
						description
					})
					.where(eq(worldItems.id, id))
					.returning();

				for (const mediaItemId of mediaItems) {
					await transaction.insert(worldItems_to_mediaItems).values({
						worldItemId: newItem.id,
						mediaItemId
					});
				}

				for (const value of values) {
					await transaction.insert(worldItems_to_worldCurrencies).values({
						worldItemId: newItem.id,
						worldCurrencyId: value.currencyId,
						amount: value.amount
					});
				}

				return newItem;
			} catch {
				transaction.rollback();
			}
		});

		if (!item) {
			throw new Error('There was an error during the item update');
		}

		return await this.mapDbSchema(item);
	}

	public async deleteItem(id: string): Promise<void> {
		await this.db.delete(worldItems).where(eq(worldItems.id, id));
	}

	private async mapDbSchema(rawItem: WorldItemSchema): Promise<WorldItem> {
		const currencies = await this.db.query.worldItems_to_worldCurrencies.findMany({
			where: eq(worldItems_to_worldCurrencies.worldItemId, rawItem.id)
		});

		const mediaItems = await this.db.query.worldItems_to_mediaItems.findMany({
			where: eq(worldItems_to_mediaItems.worldItemId, rawItem.id)
		});

		return new WorldItem(
			rawItem.id,
			rawItem.name,
			rawItem.description ?? '',
			rawItem.createdAt,
			rawItem.updatedAt,
			await this.mapRawCurrencies(currencies),
			await this.mapRawMediaItems(mediaItems)
		);
	}

	private async mapRawCurrencies(currencies: WorldItemToCurrencySchema[]): Promise<ValueModel[]> {
		if (currencies.length > 0) {
			const mappedCurrencies: ValueModel[] = [];
			for (const currency of currencies) {
				const currencyInstance = await this.currencyService.getCurrency(currency.worldCurrencyId);
				mappedCurrencies.push({ currency: currencyInstance, amount: currency.amount });
			}
			return mappedCurrencies;
		}
		return [];
	}

	private async mapRawMediaItems(
		mediaItems: WorldItemToMediaItemSchema[]
	): Promise<MediaItemSchema[]> {
		if (mediaItems.length > 0) {
			const mappedMediaItems: MediaItemSchema[] = [];
			for (const mediaItem of mediaItems) {
				const mediaItemInstance = await this.mediaService.getMediaItem(mediaItem.mediaItemId);
				mappedMediaItems.push(mediaItemInstance);
			}
			return mappedMediaItems;
		}
		return [];
	}
}
