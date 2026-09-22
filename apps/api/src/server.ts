import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import treesPlugin from './routes/trees';
import membersPlugin from './routes/members';
import relationshipsPlugin from './routes/relationships';
import searchPlugin from './routes/search';

const server: FastifyInstance = fastify({ logger: true });

server.register(cors, {
  origin: process.env.CORS_ORIGIN
    ? (process.env.CORS_ORIGIN === '*' ? true : process.env.CORS_ORIGIN.split(',').map((s: string) => s.trim()))
    : true,
  credentials: true
});

server.register(sensible);

// Health check endpoints for Render and monitoring
server.get('/', async () => ({ status: 'ok', service: 'kinfolk-api' }));
server.get('/health', async () => ({ status: 'ok', service: 'kinfolk-api' }));
server.get('/api', async () => ({ status: 'ok', service: 'kinfolk-api' }));
server.get('/api/health', async () => ({ status: 'ok', service: 'kinfolk-api' }));

server.register(treesPlugin);
server.register(membersPlugin);
server.register(relationshipsPlugin);
server.register(searchPlugin);

export default server;
export { server };

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';
    await server.listen({ port, host });
    console.log(`Server listening on ${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await server.close();
  process.exit(0);
});

// Run standalone server in local/standard environments, but not when imported by Vercel Serverless Functions
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  start();
}
