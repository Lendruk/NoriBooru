import { eq } from 'drizzle-orm';
import { inject, injectable } from 'inversify';
import {
	mediaItems,
	playlists,
	playlists_mediaItems_table,
	PlaylistSchema
} from '../db/vault/schema';
import { VaultDb } from '../lib/VaultAPI';
import { VaultService } from '../lib/VaultService';
import { MediaItem } from './MediaService';

type PlaylistWithItems = PlaylistSchema & { items: number[] };

type PlaylistWithPopulatedItems = PlaylistSchema & { items: MediaItem[] };

@injectable()
export class PlaylistService extends VaultService {
	public constructor(@inject('db') protected db: VaultDb) {
		super(db);
	}

	public async getPlaylists(): Promise<PlaylistWithItems[]> {
		const playlists = await this.db.query.playlists.findMany();
		const finalPlaylists: PlaylistWithItems[] = [];

		for (const playlist of playlists) {
			const itemIds = await this.db.query.playlists_mediaItems_table.findMany({
				where: eq(playlists_mediaItems_table.playlistId, playlist.id)
			});
			finalPlaylists.push({
				...playlist,
				items: itemIds.map((item) => item.mediaItemId)
			});
		}
		return finalPlaylists;
	}

	public async getPlaylist(id: number): Promise<PlaylistWithPopulatedItems> {
		const rows = await this.db
			.select({
				id: playlists.id,
				name: playlists.name,
				createdAt: playlists.createdAt,
				timePerItem: playlists.timePerItem,
				randomizeOrder: playlists.randomizeOrder,
				updatedAt: playlists.updatedAt,
				item: {
					id: mediaItems.id,
					fileName: mediaItems.fileName,
					type: mediaItems.type,
					extension: mediaItems.extension,
					fileSize: mediaItems.fileSize,
					sdCheckpoint: mediaItems.sdCheckpoint,
					createdAt: mediaItems.createdAt,
					updatedAt: mediaItems.updatedAt,
					isArchived: mediaItems.isArchived,
					hash: mediaItems.hash,
					originalFileName: mediaItems.originalFileName,
					index: playlists_mediaItems_table.itemIndex,
					source: mediaItems.source
				}
			})
			.from(playlists)
			.where(eq(playlists.id, id))
			.leftJoin(playlists_mediaItems_table, eq(playlists_mediaItems_table.playlistId, playlists.id))
			.leftJoin(mediaItems, eq(playlists_mediaItems_table.mediaItemId, mediaItems.id));

		const playlist = Object.values(
			rows.reduce<Record<number, PlaylistWithPopulatedItems>>((acc, row) => {
				const { createdAt, id, name, randomizeOrder, updatedAt, timePerItem, item } = row;

				if (!acc[id]) {
					acc[id] = {
						createdAt,
						id,
						timePerItem,
						name,
						randomizeOrder,
						updatedAt,
						items: []
					};
				}

				if (item) {
					acc[id].items![item.index!] = {
						tags: [],
						createdAt: item.createdAt!,
						extension: item.extension!,
						fileSize: item.fileSize!,
						fileName: item.fileName!,
						id: item.id!,
						sdCheckpoint: item.sdCheckpoint,
						isArchived: item.isArchived === 1 ? true : false,
						type: item.type!,
						hash: item.hash!,
						updatedAt: item.updatedAt,
						originalFileName: item.originalFileName,
						source: item.source
					};
				}

				return acc;
			}, {})
		)[0];

		return playlist;
	}

	public async deletePlaylist(id: number): Promise<void> {
		await this.db
			.delete(playlists_mediaItems_table)
			.where(eq(playlists_mediaItems_table.playlistId, id));
		await this.db.delete(playlists).where(eq(playlists.id, id));
	}

	public async addMediaItemToPlaylist(id: number, mediaItemId: number): Promise<void> {
		// Get latest item index
		const latestItemIndex = await this.db.query.playlists_mediaItems_table.findFirst({
			where: eq(playlists_mediaItems_table.playlistId, id),
			orderBy: playlists_mediaItems_table.itemIndex
		});

		if (!latestItemIndex) {
			throw new Error('No items found in playlist');
		}

		await this.db
			.insert(playlists_mediaItems_table)
			.values({
				playlistId: id,
				mediaItemId,
				itemIndex: latestItemIndex.itemIndex + 1
			})
			.returning();
	}
}
