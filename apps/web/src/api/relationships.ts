import { apiRequest } from './client';
import type { ParentChild, CreateUnionInput, Union } from '@kinfolk/shared';

export async function linkParent(memberId: string, parentId: string, type?: string): Promise<ParentChild> {
  return apiRequest<ParentChild>(`/members/${memberId}/parents/${parentId}`, {
    method: 'POST',
    body: JSON.stringify({ parentId, relationshipType: type || 'biological', type: type || 'biological' }),
  });
}

export async function unlinkParent(memberId: string, parentId: string): Promise<void> {
  return apiRequest<void>(`/members/${memberId}/parents/${parentId}`, {
    method: 'DELETE',
  });
}

export async function createUnion(data: CreateUnionInput): Promise<Union> {
  return apiRequest<Union>(`/unions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteUnion(unionId: string): Promise<void> {
  return apiRequest<void>(`/unions/${unionId}`, {
    method: 'DELETE',
  });
}
