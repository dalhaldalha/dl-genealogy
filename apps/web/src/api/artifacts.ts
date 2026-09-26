import { apiRequest } from './client';
import type { MediaArtifact } from '@kinfolk/shared';

export async function fetchArtifacts(memberId: string): Promise<MediaArtifact[]> {
  return apiRequest<MediaArtifact[]>(`/members/${memberId}/artifacts`);
}

export async function createArtifact(memberId: string, data: { url: string; caption?: string; artifactType?: string }): Promise<MediaArtifact> {
  return apiRequest<MediaArtifact>(`/members/${memberId}/artifacts`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteArtifact(artifactId: string): Promise<void> {
  return apiRequest<void>(`/artifacts/${artifactId}`, { method: 'DELETE' });
}
