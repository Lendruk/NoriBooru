import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../types/Request';
import { checkVault } from '../../hooks/checkVault';

const promptSD = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if(!vault) {
		return reply.status(400).send('No vault provided');
	}

	const requestBody = request.body;

	const result = await fetch('http://localhost:7861/sdapi/v1/txt2img', { 
		method: 'POST', 
		body: JSON.stringify(requestBody), 
		headers: {
			'Content-Type': 'application/json',
		},
	});
	const body = await result.json();
	console.log(body);

	reply.send(body);
};

export default {
	method: 'POST',
	url: '/sd/prompt',
	handler: promptSD,
	onRequest: checkVault,
} as RouteOptions;