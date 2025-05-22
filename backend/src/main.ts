import 'reflect-metadata';
import { GlobalAPI } from './lib/GlobalAPI';

(async () => {
	const globalApi = new GlobalAPI();

	await globalApi.init();
	await globalApi.listen();
})();
