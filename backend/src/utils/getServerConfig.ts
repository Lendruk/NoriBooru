import fs from 'fs/promises';
import path from 'path';
import { ServerConfig } from '../types/ServerConfig';

export const getServerConfig = async (): Promise<ServerConfig> => {
	const configPath = path.join(process.cwd(), 'server.config.json');
	const config = await fs.readFile(configPath, 'utf-8');
	return JSON.parse(config) satisfies ServerConfig;
};
