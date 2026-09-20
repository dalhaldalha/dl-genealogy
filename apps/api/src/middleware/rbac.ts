import { FastifyRequest, FastifyReply } from 'fastify';

export const requireRole = (role: 'viewer' | 'admin') => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userRole = request.headers['x-user-role'];
    
    if (role === 'admin' && userRole !== 'admin') {
      return reply.code(403).send({ error: 'Forbidden' });
    }
    
    if (role === 'viewer' && userRole !== 'admin' && userRole !== 'viewer') {
      return reply.code(403).send({ error: 'Forbidden' });
    }
  };
};
