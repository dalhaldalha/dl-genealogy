import { FastifyInstance } from 'fastify';
import prisma from '../db/client';

export default async function treesPlugin(server: FastifyInstance) {
  server.get('/api/trees/:treeId', async (request, reply) => {
    try {
      const { treeId } = request.params as { treeId: string };
      
      const tree = await prisma.familyTree.findUnique({
        where: { id: treeId },
        include: {
          members: {
            include: {
              parentOf: true,
              childOf: true,
              unionsAsPartner1: true,
              unionsAsPartner2: true,
              artifacts: true
            }
          }
        }
      });

      if (!tree) {
        return reply.notFound('Tree not found');
      }

      const members = tree.members.map(m => {
        const { parentOf, childOf, unionsAsPartner1, unionsAsPartner2, artifacts, ...rest } = m;
        return rest;
      });

      const parentChildEdges = tree.members.flatMap(m => m.parentOf);
      const unions = tree.members.flatMap(m => m.unionsAsPartner1);
      const artifacts = tree.members.flatMap(m => m.artifacts);

      // deduplicate unions since we fetch from partner1
      const uniqueUnions = Array.from(new Map(unions.map(u => [u.id, u])).values());

      return {
        tree: {
          id: tree.id,
          name: tree.name,
          subtitle: tree.subtitle,
          createdAt: tree.createdAt,
          updatedAt: tree.updatedAt
        },
        members,
        parentChildEdges,
        unions: uniqueUnions,
        artifacts
      };
    } catch (error) {
      server.log.error(error);
      return reply.internalServerError();
    }
  });
}
