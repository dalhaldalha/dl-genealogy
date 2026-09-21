import { FastifyInstance } from 'fastify';
import prisma from '../db/client';

export default async function treesPlugin(server: FastifyInstance) {
  server.get('/api/trees/:treeId', async (request, reply) => {
    try {
      const { treeId } = request.params as { treeId: string };
      
      let tree;
      if (treeId === 'active') {
        tree = await prisma.familyTree.findFirst({
          orderBy: { createdAt: 'desc' },
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
          tree = await prisma.familyTree.create({
            data: {
              name: 'My Family Tree',
              subtitle: 'Our Family Lineage'
            },
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
        }
      } else {
        tree = await prisma.familyTree.findUnique({
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
      }

      if (!tree) {
        return reply.notFound('Tree not found');
      }

      const members = tree.members.map((m: any) => {
        const { parentOf, childOf, unionsAsPartner1, unionsAsPartner2, artifacts, ...rest } = m;
        return rest;
      });

      const parentChildEdges = tree.members.flatMap((m: any) => m.parentOf);
      const unions = tree.members.flatMap((m: any) => m.unionsAsPartner1);
      const artifacts = tree.members.flatMap((m: any) => m.artifacts);

      // deduplicate unions since we fetch from partner1
      const uniqueUnions = Array.from(new Map(unions.map((u: any) => [u.id, u])).values());

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
