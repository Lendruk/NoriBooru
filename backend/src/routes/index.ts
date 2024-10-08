import vaultRoutes from './global/vaults';
import imageRoutes from './vault/images';
import mediaItemRoutes from './vault/media';
import playlistRoutes from './vault/playlists';
import sdRoutes from './vault/sd';
import tagRoutes from './vault/tags';
import watcherRoutes from './vault/watchers';
import websocketHandler from './websockets';
export default [
	websocketHandler,
	...imageRoutes,
	...vaultRoutes,
	...mediaItemRoutes,
	...tagRoutes,
	...playlistRoutes,
	...sdRoutes,
	...watcherRoutes
];
