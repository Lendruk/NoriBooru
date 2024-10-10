import civtaiRoutes from './civtai';
import installSDUi from './installSDUi';
import interruptGeneration from './interruptGeneration';
import loraRoutes from './loras';
import markSDAsInactive from './markSDAsInactive';
import promptCruds from './prompts';
import promptSD from './promptSD';
import refreshCheckpoints from './refreshCheckpoints';
import startSDUi from './startSDUi';
import stopSDUi from './stopSDUi';
import uninstallSDUi from './uninstallSDUi';
import unloadCheckpoint from './unloadCheckpoint';
import updateCheckpoint from './updateCheckpoint';
import wildcardRoutes from './wildcards';

export default [
	installSDUi,
	uninstallSDUi,
	startSDUi,
	stopSDUi,
	markSDAsInactive,
	promptSD,
	interruptGeneration,
	refreshCheckpoints,
	unloadCheckpoint,
	updateCheckpoint,
	...promptCruds,
	...loraRoutes,
	...wildcardRoutes,
	...civtaiRoutes
];
