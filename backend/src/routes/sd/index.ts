import getCheckpoints from './getCheckpoints';
import getHighResUpscalers from './getHighResUpscalers';
import getProgress from './getProgress';
import getSamplers from './getSamplers';
import getSchedulers from './getSchedulers';
import installSDUi from './installSDUi';
import interruptGeneration from './interruptGeneration';
import loraRoutes from './loras';
import markSDAsInactive from './markSDAsInactive';
import promptCruds from './prompts';
import promptSD from './promptSD';
import refreshCheckpoints from './refreshCheckpoints';
import startSDUi from './startSDUi';
import stopSDUi from './stopSDUi';
import wildcardRoutes from './wildcards';

export default [
	installSDUi,
	startSDUi,
	stopSDUi,
	markSDAsInactive,
	getCheckpoints,
	getSamplers,
	getSchedulers,
	promptSD,
	getHighResUpscalers,
	interruptGeneration,
	refreshCheckpoints,
	getProgress,
	...promptCruds,
	...loraRoutes,
	...wildcardRoutes
];
