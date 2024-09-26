import { eq } from 'drizzle-orm';
import { inject, injectable } from 'inversify';
import { MediaItem } from '../../db/vault/schema';
import {
	worldItems_to_mediaItems,
	worldItems_to_worldCurrencies,
	WorldItemSchema,
	WorldItemToCurrencySchema,
	WorldItemToMediaItemSchema
} from '../../db/vault/worldBuildingSchema';
import { VaultDb } from '../../lib/VaultInstance';
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

	private async mapRawMediaItems(mediaItems: WorldItemToMediaItemSchema[]): Promise<MediaItem[]> {
		if (mediaItems.length > 0) {
			const mappedMediaItems: MediaItem[] = [];
			for (const mediaItem of mediaItems) {
				const mediaItemInstance = await this.mediaService.getMediaItem(mediaItem.mediaItemId);
				mappedMediaItems.push(mediaItemInstance);
			}
			return mappedMediaItems;
		}
		return [];
	}
}
