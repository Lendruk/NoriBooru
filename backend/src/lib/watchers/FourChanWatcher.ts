import { parse } from 'node-html-parser';
import { activeWatchers_to_mediaItems, ActiveWatcherSchema } from '../../db/vault/schema';
import { mediaService } from '../../services/MediaService';
import { pause } from '../../utils/pause';
import { VaultInstance } from '../VaultInstance';
import { ActiveWatcher } from './ActiveWatcher';

export type FourChanWatcherData = {
	filesDownloaded: string[];
};

export class FourChanWatcher extends ActiveWatcher<FourChanWatcherData> {
	private static readonly BASE_ITEM_URL = 'https://i.4cdn.org/';
	public constructor(rawWatcher: ActiveWatcherSchema, vault: VaultInstance) {
		super(rawWatcher, vault);

		this.instanceData = this.data
			? JSON.parse(this.data)
			: ({ filesDownloaded: [] } as FourChanWatcherData);
	}

	public async queryPage(): Promise<void> {
		if (this.status !== 'running') {
			return;
		}

		const response = await fetch(this.url);
		const body = await response.text();
		const parsedHtml = parse(body);
		console.log('Querying 4chan');
		const board = this.url.split('/')[3];
		let isClosed = false;

		const imgs = parsedHtml.querySelectorAll('img');
		for (const img of imgs) {
			if (img.getAttribute('alt') === '404 Not Found') {
				this.totalItems = 0;
				this.status = 'dead';
				await this.save();
				return;
			}
		}

		const closedElement = parsedHtml.querySelector('.closed');

		if (closedElement) {
			isClosed = true;
		}

		const thumbs = parsedHtml.querySelectorAll('.fileThumb');

		this.totalItems = thumbs.length;
		let itemsFetchedThisRun = 0;
		for (const thumb of thumbs) {
			const href = thumb.getAttribute('href');

			if (href) {
				const fileName = href.split('/').pop()!;
				if (!this.instanceData.filesDownloaded.includes(fileName)) {
					const itemUrl = `${FourChanWatcher.BASE_ITEM_URL}${board}/${fileName}`;
					const itemBuffer = Buffer.from(await (await fetch(itemUrl)).arrayBuffer());

					const { id: mediaItemId } = await mediaService.createItemFromBase64({
						base64EncodedImage: itemBuffer.toString('base64'),
						fileExtension: fileName.split('.').pop()!,
						vault: this.vault,
						source: itemUrl
					});
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

		if (this.itemsDownloaded === this.totalItems && isClosed) {
			this.status = 'finished';
		}

		await this.save();
	}

	public override toSchema(): ActiveWatcherSchema {
		return {
			...super.toSchema(),
			data: JSON.stringify(this.instanceData)
		};
	}
}
