import videoRoutes from './videos';
import vaultRoutes from './vaults';
import tagRoutes from './tags';
import playlistRoutes from './playlists';
import mediaItemRoutes from './media';
import imageRoutes from './images';
import sdRoutes from './sd';

export default [
	...videoRoutes,
	...imageRoutes,
	...vaultRoutes,
	...mediaItemRoutes,
	...tagRoutes,
	...playlistRoutes,
	...sdRoutes
];
