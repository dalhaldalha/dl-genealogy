import { FastifyInstance } from 'fastify';
import prisma from '../db/client';
import { z } from 'zod';
import { RelationshipType, UnionType } from '@prisma/client';

const createParentChildSchema = z.object({
  parentId: z.string().uuid(),
  relationshipType: z.nativeEnum(RelationshipType).optional()
});

const createUnionSchema = z.object({
  partner1Id: z.string().uuid(),
  partner2Id: z.string().uuid(),
  unionType: z.nativeEnum(UnionType).optional(),
  unionDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  dissolutionDate: z.string().optional().transform(str => str ? new Date(str) : undefined)
});

export default async function relationshipsPlugin(server: FastifyInstance) {
  server.post('/api/members/:memberId/parents', async (request, reply) => {
    try {
      const { memberId } = request.params as { memberId: string };
      const data = createParentChildSchema.parse(request.body);

      const relation = await prisma.parentChild.create({
        data: {
          childId: memberId,
          parentId: data.parentId,
          relationshipType: data.relationshipType
        }
      });
      return reply.code(201).send(relation);
    } catch (error) {
      server.log.error(error);
      if (error instanceof z.ZodError) {
        return reply.badRequest(error.message);
      }
      return reply.internalServerError();
    }
  });

  server.delete('/api/members/:memberId/parents/:parentId', async (request, reply) => {
    try {
      const { memberId, parentId } = request.params as { memberId: string, parentId: string };
      await prisma.parentChild.delete({
        where: {
          parentId_childId: {
            parentId,
            childId: memberId
          }
        }
      });
      return { success: true };
    } catch (error) {
      server.log.error(error);
      return reply.internalServerError();
    }
  });

  server.post('/api/unions', async (request, reply) => {
    try {
      const data = createUnionSchema.parse(request.body);
      const union = await prisma.union.create({
        data
      });
      return reply.code(201).send(union);
    } catch (error) {
      server.log.error(error);
      if (error instanceof z.ZodError) {
        return reply.badRequest(error.message);
      }
      return reply.internalServerError();
    }
  });

  server.delete('/api/unions/:unionId', async (request, reply) => {
    try {
      const { unionId } = request.params as { unionId: string };
      await prisma.union.delete({
        where: { id: unionId }
      });
      return { success: true };
    } catch (error) {
      server.log.error(error);
      return reply.internalServerError();
    }
  });
}
