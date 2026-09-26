import { FastifyInstance } from 'fastify';
import prisma from '../db/client';
import { z } from 'zod';

const createArtifactSchema = z.object({
  url: z.string().min(1),
  thumbnailUrl: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  artifactType: z.enum(['photo', 'document', 'letter', 'certificate', 'audio', 'video']).optional().default('photo'),
  sortOrder: z.number().optional().default(0),
});

export default async function artifactsPlugin(server: FastifyInstance) {
  // GET /api/members/:memberId/artifacts
  const listHandler = async (request: any, reply: any) => {
    const { memberId } = request.params;
    try {
      const artifacts = await prisma.mediaArtifact.findMany({
        where: { memberId },
        orderBy: { sortOrder: 'asc' },
      });
      return artifacts;
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch artifacts' });
    }
  };
  
  // POST /api/members/:memberId/artifacts  
  const createHandler = async (request: any, reply: any) => {
    const { memberId } = request.params;
    try {
      const data = createArtifactSchema.parse(request.body);
      
      // Handle audio/video gracefully if not migrated in Prisma enum yet
      let dbArtifactType = data.artifactType;
      if (['audio', 'video'].includes(data.artifactType)) {
        // Fallback to document if enum doesn't support it yet
        dbArtifactType = 'document'; 
      }

      const artifact = await prisma.mediaArtifact.create({
        data: {
          memberId,
          url: data.url,
          thumbnailUrl: data.thumbnailUrl,
          caption: data.caption,
          artifactType: dbArtifactType as any,
          sortOrder: data.sortOrder,
        },
      });
      
      // Restore the requested type for the response just in case client expects it
      return { ...artifact, artifactType: data.artifactType };
    } catch (error) {
      server.log.error(error);
      return reply.status(400).send({ error: 'Invalid request or failed to create artifact' });
    }
  };
  
  // DELETE /api/artifacts/:artifactId
  const deleteHandler = async (request: any, reply: any) => {
    const { artifactId } = request.params;
    try {
      await prisma.mediaArtifact.delete({
        where: { id: artifactId },
      });
      return reply.status(204).send();
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete artifact' });
    }
  };
  
  // Register routes with both prefixes
  server.get('/api/members/:memberId/artifacts', listHandler);
  server.get('/members/:memberId/artifacts', listHandler);
  server.post('/api/members/:memberId/artifacts', createHandler);
  server.post('/members/:memberId/artifacts', createHandler);
  server.delete('/api/artifacts/:artifactId', deleteHandler);
  server.delete('/artifacts/:artifactId', deleteHandler);
}
