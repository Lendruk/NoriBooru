import { FastifyReply, FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { Route, Router } from '../../lib/Router';
import { PlaylistService } from '../../services/PlaylistService';

type PlaylistCreationRequest = {
	name: string;
	randomizeOrder: boolean;
	timePerItem: number;
	items: number[];
};

@injectable()
export class PlaylistRouter extends Router {
	public constructor(@inject(PlaylistService) private playlistService: PlaylistService) {
		super();
	}

	@Route.GET('/playlists')
	public async getPlaylists() {
		return await this.playlistService.getPlaylists();
	}

	@Route.GET('/playlists/:id')
	public async getPlaylist(request: FastifyRequest) {
		const { id } = request.params as { id: string };
		return await this.playlistService.getPlaylist(Number.parseInt(id));
	}

	@Route.POST('/playlists')
	public async createPlaylist(request: FastifyRequest, reply: FastifyReply) {
		const body = request.body as PlaylistCreationRequest;
		const playlist = await this.playlistService.createPlaylist(
			body.name,
			body.randomizeOrder,
			body.timePerItem,
			body.items
		);
		return reply.send(playlist);
	}

	@Route.DELETE('/playlists/:id')
	public async deletePlaylist(request: FastifyRequest) {
		const { id } = request.params as { id: string };
		await this.playlistService.deletePlaylist(Number.parseInt(id));
	}

	@Route.PATCH('/playlists/:id/add-item')
	public async addPlaylistItem(request: FastifyRequest) {
		const { id } = request.params as { id: string };
		const body = request.body as { item: number };
		await this.playlistService.addMediaItemToPlaylist(Number.parseInt(id), body.item);
	}
}
