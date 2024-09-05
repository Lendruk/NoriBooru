import { eq } from 'drizzle-orm';
import { parse } from 'node-html-parser';
import {
	activeWatchers,
	activeWatchers_to_mediaItems,
	ActiveWatcherSchema
} from '../../db/vault/schema';
import { mediaService } from '../../services/MediaService';
import { pause } from '../../utils/pause';
import { VaultInstance } from '../VaultInstance';
import { ActiveWatcher } from './ActiveWatcher';

export type FourChanWatcherData = {
	filesDownloaded: string[];
};

export class FourChanWatcher extends ActiveWatcher {
	private static readonly BASE_URL = 'https://i.4cdn.org/';
	private instanceData: FourChanWatcherData;
	public constructor(rawWatcher: ActiveWatcherSchema, vault: VaultInstance) {
		super(rawWatcher, vault);

		this.instanceData = this.data
			? JSON.parse(this.data)
			: ({ filesDownloaded: [] } as FourChanWatcherData);
	}

	public async queryPage(): Promise<void> {
		const response = await fetch(this.url);
		const body = await response.text();
		const parsedHtml = parse(body);
		console.log('Querying 4chan');
		const board = this.url.split('/')[3];
		const thumbs = parsedHtml.querySelectorAll('.fileThumb');

		this.totalItems = thumbs.length;
		let itemsFetchedThisRun = 0;
		for (const thumb of thumbs) {
			const href = thumb.getAttribute('href');

			if (href) {
				const fileName = href.split('/').pop()!;
				if (!this.instanceData.filesDownloaded.includes(fileName)) {
					const itemUrl = `${FourChanWatcher.BASE_URL}${board}/${fileName}`;
					const itemBuffer = Buffer.from(await (await fetch(itemUrl)).arrayBuffer());

					const { id: mediaItemId } = await mediaService.createItemFromBase64(
						itemBuffer.toString('base64'),
						fileName.split('.').pop()!,
						this.vault
					);
					await this.vault.db.insert(activeWatchers_to_mediaItems).values({
						activeWatcherId: this.id,
						mediaItemId
					});
					this.instanceData.filesDownloaded.push(fileName);
					this.itemsDownloaded++;
					itemsFetchedThisRun++;

					await this.save();
					if (itemsFetchedThisRun >= this.itemsPerRequest) {
						break;
					}
					await pause(1500);

					if (this.status !== 'running') {
						break;
					}
				}
			}
		}

		if (itemsFetchedThisRun === 0) {
			this.timeSinceNewItems += Date.now() - this.lastRequestedAt;

			if (this.timeSinceNewItems >= this.inactivityTimeout) {
				return await this.stop();
			}
		} else {
			this.timeSinceNewItems = 0;
		}
		this.lastRequestedAt = Date.now();
		await this.save();
	}

	public async save(): Promise<void> {
		await this.vault.db
			.update(activeWatchers)
			.set({
				data: JSON.stringify(this.instanceData),
				status: this.status,
				description: this.description,
				lastRequestedAt: this.lastRequestedAt,
				itemsDownloaded: this.itemsDownloaded,
				timeSinceNewItems: this.timeSinceNewItems,
				totalItems: this.totalItems
			})
			.where(eq(activeWatchers.id, this.id));
	}

	public override toSchema(): ActiveWatcherSchema {
		return {
			...super.toSchema(),
			data: JSON.stringify(this.instanceData)
		};
	}
}
