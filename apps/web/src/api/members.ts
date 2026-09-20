import { apiRequest } from './client';
import type { FamilyMember, CreateMemberInput, UpdateMemberInput } from '@kinfolk/shared';

export async function fetchMembers(treeId: string, branch?: string): Promise<FamilyMember[]> {
  const query = branch ? `?branch=${branch}` : '';
  return apiRequest<FamilyMember[]>(`/trees/${treeId}/members${query}`);
}

export async function createMember(treeId: string, data: CreateMemberInput): Promise<FamilyMember> {
  return apiRequest<FamilyMember>(`/trees/${treeId}/members`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateMember(memberId: string, data: UpdateMemberInput): Promise<FamilyMember> {
  return apiRequest<FamilyMember>(`/members/${memberId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteMember(memberId: string): Promise<void> {
  return apiRequest<void>(`/members/${memberId}`, {
    method: 'DELETE',
  });
}
