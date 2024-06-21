import { FastifyReply, FastifyRequest } from 'fastify';
import { Request } from '../types/Request';
import { VaultController } from '../db/VaultController';
import { eq } from 'drizzle-orm';
import { masterDb } from '../db/master/db';
import { vaults } from '../db/master/schema';

export const checkVault = async (req: FastifyRequest, reply: FastifyReply) => {
	const vaultHeader = req.headers['vault'];
	if(vaultHeader && typeof vaultHeader === 'string') {
		if (!VaultController.vaults.has(vaultHeader)) {
			const vault = await masterDb.query.vaults.findFirst({ where: eq(vaults.id, vaultHeader )});
			
			if(!vault) {
				return reply.status(400).send({ message: 'Vault not found' });
			}
			await VaultController.registerVault(vault);
		}

		(req as Request)['vault'] = VaultController.getVault(vaultHeader);
	}
};