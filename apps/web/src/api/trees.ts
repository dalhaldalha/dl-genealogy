import { apiRequest } from './client';
import type { FamilyTreeFull } from '@kinfolk/shared';

export async function fetchTree(treeId: string): Promise<FamilyTreeFull> {
  return apiRequest<FamilyTreeFull>(`/trees/${treeId}`);
}
