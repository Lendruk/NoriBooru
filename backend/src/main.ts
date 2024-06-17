import Fastify from 'fastify';
import cors from '@fastify/cors';
import routes from './routes';
import multipart from '@fastify/multipart';

const app = Fastify({
	logger: true,
	bodyLimit: 100000000, // ~100mb
});

app.register(cors);
app.register(multipart, {
	limits: {
		files: 100,
		fileSize: 107374182400,
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

