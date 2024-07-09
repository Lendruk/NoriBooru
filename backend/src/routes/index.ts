import imageRoutes from './images';
import mediaItemRoutes from './media';
import playlistRoutes from './playlists';
import sdRoutes from './sd';
import tagRoutes from './tags';
import vaultRoutes from './vaults';
import videoRoutes from './videos';
import websocketHandler from './websockets';
export default [
	websocketHandler,
	...videoRoutes,
	...imageRoutes,
	...vaultRoutes,
	...mediaItemRoutes,
	...tagRoutes,
	...playlistRoutes,
	...sdRoutes
];
