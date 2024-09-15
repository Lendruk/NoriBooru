import { activeWatchers_to_mediaItems, ActiveWatcherSchema } from '../../db/vault/schema';
import { MediaService } from '../../services/MediaService';
import { WebsocketService } from '../../services/WebsocketService';
import { pause } from '../../utils/pause';
import type { VaultDb } from '../VaultInstance';
import { ActiveWatcher } from './ActiveWatcher';

type RedditJsonPost = {
	kind: string;
	data: {
		subreddit: string;
		title: string;
		url?: string;
		gallery_data?: {
			items: { media_id: string; id: number }[];
		};
		media_metadata: Record<
			string, // media id
			{
				m: string; // mime type
			}
		>;
	};
};

export type RedditJsonPage = {
	kind: string;
	data: {
		after: string;
		dist: number;
		children: RedditJsonPost[];
	};
};

export type RedditWatcherData = {
	lastRequestedItemId: string;
	lastRequestedListingId?: string;
	listingItemIndex: number;
	duplicatesSkipped: number;
};

export class RedditWatcher extends ActiveWatcher<RedditWatcherData> {
	public constructor(
		rawWatcher: ActiveWatcherSchema,
		db: VaultDb,
		websocketService: WebsocketService,
		private mediaService: MediaService
	) {
		super(rawWatcher, db, websocketService);

		this.instanceData = this.data
			? JSON.parse(this.data)
			: { lastRequestedItemId: '', listingItemIndex: 0, duplicatesSkipped: 0 };
	}

	public async queryPage(): Promise<void> {
		const formattedUrl = this.formatRedditLink(this.url);
		const response = await fetch(formattedUrl);
		const body = (await response.json()) as RedditJsonPage;

		console.log(formattedUrl);
		if (this.instanceData.lastRequestedListingId !== body.data.after) {
			this.totalItems = (this.totalItems ?? 0) + body.data.children.length;
		}

		this.instanceData.lastRequestedListingId = body.data.after;
		let itemsFetchedThisRun = 0;
		for (let i = 0; i < body.data.children.length; i++) {
			const post = body.data.children[i];
			this.instanceData.listingItemIndex = i;

			const itemsToProcess: { url: string; fileName: string }[] = [];
			if (post.data.gallery_data) {
				for (const item of post.data.gallery_data.items) {
					const mediaId = item.media_id;
					const fileExtension = post.data.media_metadata[mediaId].m.split('/')[1];
					const fileName = `${mediaId}.${fileExtension}`;

					itemsToProcess.push({ url: `https://i.redd.it/${mediaId}.${fileExtension}`, fileName });
				}

				this.totalItems = this.totalItems! + itemsToProcess.length;
			} else if (post.data.url) {
				itemsToProcess.push({
					url: post.data.url,
					fileName: post.data.url.split('/').pop()!
				});
			}

			for (const item of itemsToProcess) {
				const { fileName, url } = item;
				if (!url.includes('i.redd.it')) {
					continue;
				}
				if (await this.mediaService.isThereMediaItemWithSource(url)) {
					this.instanceData.duplicatesSkipped++;
					continue;
				}

				const itemBuffer = Buffer.from(await (await fetch(url)).arrayBuffer());

				const { id: mediaItemId } = await this.mediaService.createItemFromBase64({
					base64EncodedImage: itemBuffer.toString('base64'),
					fileExtension: fileName.split('.').pop()!,
					source: url
				});
				await this.db.insert(activeWatchers_to_mediaItems).values({
					activeWatcherId: this.id,
					mediaItemId
				});
				this.instanceData.lastRequestedItemId = fileName;
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

			if (itemsFetchedThisRun >= this.itemsPerRequest) {
				break;
			}

			if (this.status !== 'running') {
				break;
			}
		}

		this.lastRequestedAt = Date.now();
		await this.save();
	}

	private formatRedditLink(url: string): string {
		let subreddit = url.split('/r/')[1];
		subreddit = subreddit.split('/')[0].trim();

		let afterParams = '';
		if (this.instanceData.lastRequestedListingId && this.instanceData.listingItemIndex == 99) {
			afterParams = `&after=${this.instanceData.lastRequestedListingId}`;
			this.instanceData.listingItemIndex = 0;
		}
		return `https://old.reddit.com/r/${subreddit}/new.json?limit=100${afterParams}`;
	}
}
