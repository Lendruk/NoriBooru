import { FastifyReply, RouteOptions } from 'fastify';
import { Request } from '../../../types/Request';
import { checkVault } from '../../../hooks/checkVault';
import { sdUiService } from '../../../services/SDUiService';
import { SDLora } from '../../../types/sd/SDLora';

type RawSDLora = {
  name: string;
  alias: string;
  path: string;
  metadata: {
    ss_sd_model_name: string;
    ss_resolution: string;
    ss_clip_skip: string;
    ss_num_train_images: string;
    ss_tag_frequency: {
      ['1_cate']: Record<string, number>
    }
  },
}

const getLoras = async (request: Request, reply: FastifyReply) => {
	const vault = request.vault;
	if(!vault) {
		return reply.status(400).send('No vault provided');
	}
	const sdPort = sdUiService.getSdPort(vault.id);
	if (!sdPort) {
		return reply.status(400).send('SD Ui is not running for the given vault');
	}


	const result = await fetch(`http://localhost:${sdPort}/sdapi/v1/loras`);
	const sdClientLoras = await result.json() as RawSDLora[];
	const { db } = vault;
	const savedLoras = await db.query.sdLoras.findMany();

	const finalLoraArr: SDLora[] = [];
	for(const rawLora of sdClientLoras) {
		
	}


	reply.send(finalLoraArr);
};

export default {
	method: 'GET',
	url: '/sd/loras',
	handler: getLoras,
	onRequest: checkVault,
} as RouteOptions;