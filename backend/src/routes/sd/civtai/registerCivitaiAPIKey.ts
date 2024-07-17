import { eq } from 'drizzle-orm';
import { FastifyReply, RouteOptions } from 'fastify';
import { masterDb } from '../../../db/master/db';
import { vaults } from '../../../db/master/schema';
import { checkVault } from '../../../hooks/checkVault';
import { Request } from '../../../types/Request';

const registerCivitaiAPIKey = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if (!vault) {
		return reply.status(400).send('No vault provided');
	}

	const { key } = request.body as { key: string };
  
	if (key) {
		await masterDb.update(vaults).set({ civitaiApiKey: key }).where(eq(vaults.id, vault.id));
	}

	reply.send({message: 'API key registered successfully'});
};

export default {
	method: 'POST',
	url: '/sd/civitai/register',
	handler: registerCivitaiAPIKey,
	onRequest: checkVault
} as RouteOptions;