import getCheckpoints from './getCheckpoints';
import getHighResUpscalers from './getHighResUpscalers';
import getSamplers from './getSamplers';
import getSchedulers from './getSchedulers';
import installSDUi from './installSDUi';
import interruptGeneration from './interruptGeneration';
import markSDAsInactive from './markSDAsInactive';
import promptSD from './promptSD';
import startSDUi from './startSDUi';
import stopSDUi from './stopSDUi';

export default [installSDUi, startSDUi, stopSDUi, markSDAsInactive, getCheckpoints, getSamplers, getSchedulers, promptSD, getHighResUpscalers, interruptGeneration];