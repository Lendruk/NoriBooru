import vaultRoutes from './global/vaults';
import websocketHandler from './websockets';
export default [websocketHandler, ...vaultRoutes];
