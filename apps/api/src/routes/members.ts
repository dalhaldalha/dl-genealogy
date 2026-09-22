import { FastifyInstance } from 'fastify';
import prisma from '../db/client';
import { z } from 'zod';
import { Branch, Gender } from '@prisma/client';

const createMemberSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  maidenName: z.string().nullable().optional().or(z.literal('')),
  gender: z.nativeEnum(Gender).optional(),
  dateOfBirth: z.string().transform(str => new Date(str)),
  dateOfDeath: z.string().nullable().optional().transform(str => (str && str.trim() !== '') ? new Date(str) : undefined),
  isDeceased: z.boolean().optional(),
  generation: z.number().optional(),
  branch: z.nativeEnum(Branch).optional(),
  profession: z.string().nullable().optional().or(z.literal('')),
  residence: z.string().nullable().optional().or(z.literal('')),
  bio: z.string().nullable().optional().or(z.literal('')),
  avatarUrl: z.string().nullable().optional().or(z.literal('')),
  spouseId: z.string().uuid().nullable().optional().or(z.literal('')),
  fatherId: z.string().uuid().nullable().optional().or(z.literal('')),
  motherId: z.string().uuid().nullable().optional().or(z.literal(''))
});

const updateMemberSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  maidenName: z.string().nullable().optional().or(z.literal('')),
  gender: z.nativeEnum(Gender).optional(),
  dateOfBirth: z.string().optional().transform(str => (str && str.trim() !== '') ? new Date(str) : undefined),
  dateOfDeath: z.string().nullable().optional().transform(str => (str && str.trim() !== '') ? new Date(str) : undefined),
  isDeceased: z.boolean().optional(),
  generation: z.number().optional(),
  branch: z.nativeEnum(Branch).optional(),
  profession: z.string().nullable().optional().or(z.literal('')),
  residence: z.string().nullable().optional().or(z.literal('')),
  bio: z.string().nullable().optional().or(z.literal('')),
  avatarUrl: z.string().nullable().optional().or(z.literal('')),
  spouseId: z.string().uuid().nullable().optional().or(z.literal('')),
  fatherId: z.string().uuid().nullable().optional().or(z.literal('')),
  motherId: z.string().uuid().nullable().optional().or(z.literal(''))
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

      // 1. Spouse union
      if (spouseId && spouseId.trim() !== '') {
        const existingUnion = await prisma.union.findFirst({
          where: {
            OR: [
              { partner1Id: spouseId, partner2Id: member.id },
              { partner1Id: member.id, partner2Id: spouseId }
            ]
          }
        });
        if (!existingUnion) {
          await prisma.union.create({
            data: {
              partner1Id: spouseId,
              partner2Id: member.id,
              unionType: 'marriage'
            }
          });
        }
      }

      // 2. Father linkage
      if (fatherId && fatherId.trim() !== '') {
        const existingFatherEdge = await prisma.parentChild.findFirst({
          where: { parentId: fatherId, childId: member.id }
        });
        if (!existingFatherEdge) {
          await prisma.parentChild.create({
            data: {
              parentId: fatherId,
              childId: member.id,
              relationshipType: 'biological'
            }
          });
        }
      }

      // 3. Mother linkage
      if (motherId && motherId.trim() !== '') {
        const existingMotherEdge = await prisma.parentChild.findFirst({
          where: { parentId: motherId, childId: member.id }
        });
        if (!existingMotherEdge) {
          await prisma.parentChild.create({
            data: {
              parentId: motherId,
              childId: member.id,
              relationshipType: 'biological'
            }
          });
        }
      }

      // 4. If both Father and Mother are set, ensure union exists between father & mother
      if (fatherId && motherId && fatherId.trim() !== '' && motherId.trim() !== '' && fatherId !== motherId) {
        const existingParentUnion = await prisma.union.findFirst({
          where: {
            OR: [
              { partner1Id: fatherId, partner2Id: motherId },
              { partner1Id: motherId, partner2Id: fatherId }
            ]
          }
        });
        if (!existingParentUnion) {
          await prisma.union.create({
            data: {
              partner1Id: fatherId,
              partner2Id: motherId,
              unionType: 'marriage'
            }
          });
        }
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
      const { spouseId, fatherId, motherId, ...memberData } = parsedData;

      const member = await prisma.familyMember.update({
        where: { id: memberId },
        data: memberData
      });

      // Find current parent links for this member
      const currentParentLinks = await prisma.parentChild.findMany({
        where: { childId: memberId },
        include: { parent: true }
      });

      const currentFatherLink = currentParentLinks.find(
        (pc) => pc.parent.gender === 'male' || (pc.parent.gender as string) !== 'female'
      );
      const currentMotherLink = currentParentLinks.find(
        (pc) => pc.parent.gender === 'female'
      );

      // --- Father relationship sync ---
      if (fatherId !== undefined) {
        const cleanFatherId = fatherId && fatherId.trim() !== '' ? fatherId : null;
        if (cleanFatherId) {
          if (currentFatherLink && currentFatherLink.parentId !== cleanFatherId) {
            await prisma.parentChild.delete({ where: { id: currentFatherLink.id } });
            await prisma.parentChild.create({
              data: {
                parentId: cleanFatherId,
                childId: memberId,
                relationshipType: 'biological'
              }
            });
          } else if (!currentFatherLink) {
            await prisma.parentChild.create({
              data: {
                parentId: cleanFatherId,
                childId: memberId,
                relationshipType: 'biological'
              }
            });
          }
        } else if (currentFatherLink) {
          await prisma.parentChild.delete({ where: { id: currentFatherLink.id } });
        }
      }

      // --- Mother relationship sync ---
      if (motherId !== undefined) {
        const cleanMotherId = motherId && motherId.trim() !== '' ? motherId : null;
        if (cleanMotherId) {
          if (currentMotherLink && currentMotherLink.parentId !== cleanMotherId) {
            await prisma.parentChild.delete({ where: { id: currentMotherLink.id } });
            await prisma.parentChild.create({
              data: {
                parentId: cleanMotherId,
                childId: memberId,
                relationshipType: 'biological'
              }
            });
          } else if (!currentMotherLink) {
            await prisma.parentChild.create({
              data: {
                parentId: cleanMotherId,
                childId: memberId,
                relationshipType: 'biological'
              }
            });
          }
        } else if (currentMotherLink) {
          await prisma.parentChild.delete({ where: { id: currentMotherLink.id } });
        }
      }

      // Determine active father and mother IDs after update
      const activeFatherId =
        fatherId !== undefined
          ? (fatherId && fatherId.trim() !== '' ? fatherId : null)
          : (currentFatherLink ? currentFatherLink.parentId : null);

      const activeMotherId =
        motherId !== undefined
          ? (motherId && motherId.trim() !== '' ? motherId : null)
          : (currentMotherLink ? currentMotherLink.parentId : null);

      // If both father and mother exist, ensure union between them
      if (activeFatherId && activeMotherId && activeFatherId !== activeMotherId) {
        const parentsUnioned = await prisma.union.findFirst({
          where: {
            OR: [
              { partner1Id: activeFatherId, partner2Id: activeMotherId },
              { partner1Id: activeMotherId, partner2Id: activeFatherId }
            ]
          }
        });
        if (!parentsUnioned) {
          await prisma.union.create({
            data: {
              partner1Id: activeFatherId,
              partner2Id: activeMotherId,
              unionType: 'marriage'
            }
          });
        }
      }

      // --- Spouse relationship sync ---
      if (spouseId !== undefined) {
        const cleanSpouseId = spouseId && spouseId.trim() !== '' ? spouseId : null;
        if (cleanSpouseId) {
          const unionExists = await prisma.union.findFirst({
            where: {
              OR: [
                { partner1Id: memberId, partner2Id: cleanSpouseId },
                { partner1Id: cleanSpouseId, partner2Id: memberId }
              ]
            }
          });
          if (!unionExists) {
            await prisma.union.create({
              data: {
                partner1Id: memberId,
                partner2Id: cleanSpouseId,
                unionType: 'marriage'
              }
            });
          }
        }
      }

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
