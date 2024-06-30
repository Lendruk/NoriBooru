import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { checkVault } from '../../hooks/checkVault';
import TagService, { PopulatedTag } from '../../services/TagService';

const getTags = async (request: Request, reply: FastifyReply) => {
	const vaultInstance = request.vault;
	const query = request.query as { name: string };
	if(!vaultInstance) {
		return reply.status(400).send('No vault provided');
	}

	const {name} = query;
	const finalTags: PopulatedTag[] = await TagService.getVaultTags(vaultInstance, name);
	return reply.send(finalTags);
};


export default {
	method: 'GET',
	url: '/tags',
	handler: getTags,
	onRequest: checkVault,
} as RouteOptions;