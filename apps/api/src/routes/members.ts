import { FastifyInstance } from 'fastify';
import prisma from '../db/client';
import { z } from 'zod';
import { Branch, Gender } from '@prisma/client';

const createMemberSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  maidenName: z.string().optional(),
  gender: z.nativeEnum(Gender).optional(),
  dateOfBirth: z.string().transform(str => new Date(str)),
  dateOfDeath: z.string().optional().transform(str => str ? new Date(str) : undefined),
  isDeceased: z.boolean().optional(),
  generation: z.number().optional(),
  branch: z.nativeEnum(Branch).optional(),
  profession: z.string().optional(),
  residence: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  spouseId: z.string().uuid().optional(),
  fatherId: z.string().uuid().optional(),
  motherId: z.string().uuid().optional()
});

const updateMemberSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  maidenName: z.string().optional(),
  gender: z.nativeEnum(Gender).optional(),
  dateOfBirth: z.string().optional().transform(str => str ? new Date(str) : undefined),
  dateOfDeath: z.string().optional().transform(str => str ? new Date(str) : undefined),
  isDeceased: z.boolean().optional(),
  generation: z.number().optional(),
  branch: z.nativeEnum(Branch).optional(),
  profession: z.string().optional(),
  residence: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional()
});

async function resolveTreeId(treeId: string): Promise<string> {
  if (treeId !== 'active') return treeId;
  const activeTree = await prisma.familyTree.findFirst({ orderBy: { createdAt: 'desc' } });
  if (activeTree) return activeTree.id;
  const newTree = await prisma.familyTree.create({
    data: { name: 'My Family Tree', subtitle: 'Our Family Lineage' }
  });
  return newTree.id;
}

export default async function membersPlugin(server: FastifyInstance) {
  const getMembersHandler = async (request: any, reply: any) => {
    try {
      const { treeId } = request.params as { treeId: string };
      const { branch } = request.query as { branch?: string };
      const resolvedId = await resolveTreeId(treeId);

      const members = await prisma.familyMember.findMany({
        where: {
          treeId: resolvedId,
          branch: branch ? (branch as Branch) : undefined
        }
      });
      return members;
    } catch (error) {
      server.log.error(error);
      return reply.internalServerError();
    }
  };

  const createMemberHandler = async (request: any, reply: any) => {
    try {
      const { treeId } = request.params as { treeId: string };
      const resolvedId = await resolveTreeId(treeId);
      const parsedData = createMemberSchema.parse(request.body);
      const { spouseId, fatherId, motherId, ...memberData } = parsedData;

      const member = await prisma.familyMember.create({
        data: {
          ...memberData,
          treeId: resolvedId
        }
      });

      if (spouseId) {
        await prisma.union.create({
          data: {
            partner1Id: spouseId,
            partner2Id: member.id
          }
        });
      }

      if (fatherId) {
        await prisma.parentChild.create({
          data: {
            parentId: fatherId,
            childId: member.id
          }
        });
      }

      if (motherId) {
        await prisma.parentChild.create({
          data: {
            parentId: motherId,
            childId: member.id
          }
        });
      }

      return reply.code(201).send(member);
    } catch (error) {
      server.log.error(error);
      if (error instanceof z.ZodError) {
        return reply.badRequest(error.message);
      }
      return reply.internalServerError();
    }
  };

  const updateMemberHandler = async (request: any, reply: any) => {
    try {
      const { memberId } = request.params as { memberId: string };
      const parsedData = updateMemberSchema.parse(request.body);

      const member = await prisma.familyMember.update({
        where: { id: memberId },
        data: parsedData
      });

      return member;
    } catch (error) {
      server.log.error(error);
      if (error instanceof z.ZodError) {
        return reply.badRequest(error.message);
      }
      return reply.internalServerError();
    }
  };

  const deleteMemberHandler = async (request: any, reply: any) => {
    try {
      const { memberId } = request.params as { memberId: string };
      await prisma.familyMember.delete({
        where: { id: memberId }
      });
      return { success: true };
    } catch (error) {
      server.log.error(error);
      return reply.internalServerError();
    }
  };

  server.get('/api/trees/:treeId/members', getMembersHandler);
  server.get('/trees/:treeId/members', getMembersHandler);

  server.post('/api/trees/:treeId/members', createMemberHandler);
  server.post('/trees/:treeId/members', createMemberHandler);

  server.patch('/api/members/:memberId', updateMemberHandler);
  server.patch('/members/:memberId', updateMemberHandler);
  server.put('/api/members/:memberId', updateMemberHandler);
  server.put('/members/:memberId', updateMemberHandler);

  server.delete('/api/members/:memberId', deleteMemberHandler);
  server.delete('/members/:memberId', deleteMemberHandler);
}
