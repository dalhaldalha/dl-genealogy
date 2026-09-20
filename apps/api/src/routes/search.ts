import { FastifyInstance } from 'fastify';
import prisma from '../db/client';

export default async function searchPlugin(server: FastifyInstance) {
  server.get('/api/trees/:treeId/search', async (request, reply) => {
    try {
      const { treeId } = request.params as { treeId: string };
      const { q } = request.query as { q?: string };

      if (!q) {
        return [];
      }

      const members = await prisma.familyMember.findMany({
        where: {
          treeId,
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { profession: { contains: q, mode: 'insensitive' } },
            { residence: { contains: q, mode: 'insensitive' } }
          ]
        }
      });

      return members;
    } catch (error) {
      server.log.error(error);
      return reply.internalServerError();
    }
  });
}
