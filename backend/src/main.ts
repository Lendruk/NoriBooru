import Fastify from 'fastify';
import cors from '@fastify/cors';
import routes from './routes';

const app = Fastify({
	logger: true
});

app.register(cors);

for (const route of routes) {
	app.register(async function (fastify) {
		fastify.route(route);
	});
}

app.listen({ port: 8080, host: '0.0.0.0' }, (err) => {
	if (err) throw err;
});

