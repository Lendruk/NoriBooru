import { FastifyRequest } from 'fastify';
import { inject, injectable } from 'inversify';
import { Route, Router } from '../../lib/Router';
import { PlaylistService } from '../../services/PlaylistService';

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

	@Route.DELETE('/playlists/:id')
	public async deletePlaylist(request: FastifyRequest) {
		const { id } = request.params as { id: string };
		await this.playlistService.deletePlaylist(Number.parseInt(id));
	}
}
