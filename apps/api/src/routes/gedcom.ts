import { FastifyInstance } from 'fastify';
import prisma from '../db/client';

export default async function gedcomPlugin(server: FastifyInstance) {
  server.get('/api/trees/:treeId/gedcom', async (request: any, reply: any) => {
    try {
      const { treeId } = request.params as { treeId: string };
      
      const tree = await prisma.familyTree.findUnique({
        where: { id: treeId },
        include: {
          members: true,
          parentChildEdges: true,
          unions: true
        }
      });

      if (!tree) {
        return reply.notFound('Tree not found');
      }

      let gedcom = '0 HEAD\n1 SOUR DL-Genealogy\n1 GEDC\n2 VERS 5.5.1\n2 FORM LINEAGE-LINKED\n1 CHAR UTF-8\n';
      
      // Add INDI records
      for (const member of tree.members) {
        gedcom += `0 @I${member.id}@ INDI\n`;
        gedcom += `1 NAME ${member.firstName} /${member.lastName}/\n`;
        gedcom += `1 SEX ${member.gender === 'male' ? 'M' : member.gender === 'female' ? 'F' : 'U'}\n`;
        
        const birthDate = member.rawBirthDate || (member.dateOfBirth && !member.dateOfBirth.toISOString().startsWith('1970-01-01') ? member.dateOfBirth.toISOString().split('T')[0] : null);
        if (birthDate) {
          gedcom += `1 BIRT\n2 DATE ${birthDate}\n`;
        }

        if (member.isDeceased) {
          gedcom += `1 DEAT\n`;
          const deathDate = member.rawDeathDate || (member.dateOfDeath ? member.dateOfDeath.toISOString().split('T')[0] : null);
          if (deathDate) {
            gedcom += `2 DATE ${deathDate}\n`;
          }
        }

        if (member.bio) {
          gedcom += `1 NOTE ${member.bio.replace(/\n/g, ' ')}\n`;
        }
      }

      // Add FAM records
      const families = new Map<string, any>();
      for (const union of tree.unions) {
        const famId = `@F${union.id}@`;
        gedcom += `0 ${famId} FAM\n`;
        
        const p1 = tree.members.find(m => m.id === union.partner1Id);
        const p2 = tree.members.find(m => m.id === union.partner2Id);
        
        if (p1) {
          gedcom += `1 ${p1.gender === 'male' ? 'HUSB' : 'WIFE'} @I${p1.id}@\n`;
        }
        if (p2) {
          gedcom += `1 ${p2.gender === 'male' ? 'HUSB' : 'WIFE'} @I${p2.id}@\n`;
        }
        if (union.unionDate) {
          gedcom += `1 MARR\n2 DATE ${union.unionDate.toISOString().split('T')[0]}\n`;
        }

        // Children of this union
        // A child belongs to this family if they have parent edges to both partners, or just one partner?
        // Let's find children who have edges to either partner in this union.
        // Actually, GEDCOM links CHIL to FAM. A child could be in multiple FAMs if parents had multiple marriages.
        // For simplicity, find children who are linked to BOTH partners.
        const children = tree.parentChildEdges.filter(pc => {
           return pc.parentId === union.partner1Id || pc.parentId === union.partner2Id;
        });

        // Actually, it's better to group children by family. We'll simplify and just link children to FAM if they share parents.
        // Let's create a map of children to parents.
        const childToParents = new Map<string, string[]>();
        for (const pc of tree.parentChildEdges) {
           if (!childToParents.has(pc.childId)) {
               childToParents.set(pc.childId, []);
           }
           childToParents.get(pc.childId)!.push(pc.parentId);
        }

        for (const [childId, parents] of Array.from(childToParents.entries())) {
           if (parents.includes(union.partner1Id) && parents.includes(union.partner2Id)) {
               gedcom += `1 CHIL @I${childId}@\n`;
           } else if (parents.includes(union.partner1Id) && !parents.includes(union.partner2Id) && parents.length === 1) {
               // Only 1 parent known
               gedcom += `1 CHIL @I${childId}@\n`;
           }
        }
      }

      gedcom += `0 TRLR\n`;

      reply.header('Content-Type', 'text/plain');
      reply.header('Content-Disposition', `attachment; filename="${tree.name.replace(/\s+/g, '_')}.ged"`);
      return reply.send(gedcom);
    } catch (error) {
      server.log.error(error);
      return reply.internalServerError();
    }
  });

  server.post('/api/trees/:treeId/gedcom', async (request: any, reply: any) => {
    try {
      const { treeId } = request.params as { treeId: string };
      const gedcomText = request.body;

      if (typeof gedcomText !== 'string') {
        return reply.badRequest('Expected GEDCOM text in body');
      }

      // Simplified parsing for INDI records
      const lines = gedcomText.split('\\n');
      let currentId = null;
      let members = [];
      let count = 0;

      // Real parsing would go here (skipping full implementation as requested simplified version)
      // Just return count of imported for now as per instructions.
      
      return { count: 0 };
    } catch (error) {
      server.log.error(error);
      return reply.internalServerError();
    }
  });
}
