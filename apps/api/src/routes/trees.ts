import { FastifyInstance } from 'fastify';
import prisma from '../db/client';
import { z } from 'zod';

const updateTreeSchema = z.object({
  name: z.string().min(1).optional(),
  subtitle: z.string().nullable().optional()
});

export default async function treesPlugin(server: FastifyInstance) {
  const getTreeHandler = async (request: any, reply: any) => {
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

      // Gather all parent-child edges from both parent and child sides, then deduplicate by id
      const allParentChild = tree.members.flatMap((m: any) => [
        ...(m.parentOf || []),
        ...(m.childOf || [])
      ]);
      const uniqueParentChildEdges = Array.from(
        new Map(allParentChild.map((e: any) => [e.id, e])).values()
      );

      // Gather all unions from both partner1 and partner2 sides, then deduplicate by id
      const allUnions = tree.members.flatMap((m: any) => [
        ...(m.unionsAsPartner1 || []),
        ...(m.unionsAsPartner2 || [])
      ]);
      const uniqueUnions = Array.from(
        new Map(allUnions.map((u: any) => [u.id, u])).values()
      );

      const artifacts = tree.members.flatMap((m: any) => m.artifacts || []);
      const uniqueArtifacts = Array.from(
        new Map(artifacts.map((a: any) => [a.id, a])).values()
      );

      return {
        id: tree.id,
        name: tree.name,
        subtitle: tree.subtitle,
        createdAt: tree.createdAt,
        updatedAt: tree.updatedAt,
        tree: {
          id: tree.id,
          name: tree.name,
          subtitle: tree.subtitle,
          createdAt: tree.createdAt,
          updatedAt: tree.updatedAt
        },
        members,
        parentChildEdges: uniqueParentChildEdges,
        unions: uniqueUnions,
        artifacts: uniqueArtifacts
      };
    } catch (error) {
      server.log.error(error);
      return reply.internalServerError();
    }
  };

  const updateTreeHandler = async (request: any, reply: any) => {
    try {
      const { treeId } = request.params as { treeId: string };
      const parsedData = updateTreeSchema.parse(request.body);
      let targetId = treeId;
      if (targetId === 'active') {
        const activeTree = await prisma.familyTree.findFirst({ orderBy: { createdAt: 'desc' } });
        if (activeTree) targetId = activeTree.id;
      }
      const updated = await prisma.familyTree.update({
        where: { id: targetId },
        data: parsedData
      });
      return updated;
    } catch (error) {
      server.log.error(error);
      if (error instanceof z.ZodError) {
        return reply.badRequest(error.message);
      }
      return reply.internalServerError();
    }
  };

  server.get('/api/trees/:treeId', getTreeHandler);
  server.get('/trees/:treeId', getTreeHandler);

  server.patch('/api/trees/:treeId', updateTreeHandler);
  server.patch('/trees/:treeId', updateTreeHandler);
  server.put('/api/trees/:treeId', updateTreeHandler);
  server.put('/trees/:treeId', updateTreeHandler);
}
