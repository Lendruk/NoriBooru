import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import ws from '@fastify/websocket';
import Fastify from 'fastify';
import routes from './routes';

const app = Fastify({
	logger: false,
	bodyLimit: 100000000 // ~100mb
});

app.register(ws);
app.register(cors);
app.register(multipart, {
	limits: {
		files: 100000,
		fileSize: 107374182400
	}
});

for (const route of routes) {
	app.register(async function (fastify) {
		fastify.route(route);
	});
}

app.listen({ port: 8080, host: '0.0.0.0' }, (err) => {
	if (err) throw err;
});
