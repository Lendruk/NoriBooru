import loraRoutes from './loras';
import promptCruds from './prompts';
import updateCheckpoint from './updateCheckpoint';
import wildcardRoutes from './wildcards';

export default [updateCheckpoint, ...promptCruds, ...loraRoutes, ...wildcardRoutes];
