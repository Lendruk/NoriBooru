import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { masterDb } from '../../db/master/db';

const getVaults = async (_: FastifyRequest, reply: FastifyReply) => {
	const vaults = await masterDb.query.vaults.findMany();
	reply.send(vaults.map(vault => ({...vault, hasInstalledSD: vault.hasInstalledSD === 1 ? true : false })));
};

export default {
	method: 'GET',
	url: '/vaults',
	handler: getVaults,
} as RouteOptions;