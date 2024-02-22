import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { masterDb } from '../../db/master/db';

const getVaults = async (_: FastifyRequest, reply: FastifyReply) => {
	const vaults = await masterDb.query.vaults.findMany();
	reply.send({ vaults });
};

export default {
	method: 'GET',
	url: '/vaults',
	handler: getVaults,
} as RouteOptions;