import type { FamilyMember, ParentChild } from '@kinfolk/shared';

/**
 * Assigns generations to nodes via BFS
 */
export function assignGenerations(members: FamilyMember[], parentChildEdges: ParentChild[]): Map<string, number> {
  const childrenMap = new Map<string, string[]>();
  const parentCount = new Map<string, number>();

  members.forEach(m => {
    childrenMap.set(m.id, []);
    parentCount.set(m.id, 0);
  });

  parentChildEdges.forEach(edge => {
    if (childrenMap.has(edge.parentId)) {
      childrenMap.get(edge.parentId)!.push(edge.childId);
    }
    if (parentCount.has(edge.childId)) {
      parentCount.set(edge.childId, parentCount.get(edge.childId)! + 1);
    }
  });

  const roots: string[] = [];
  for (const [id, count] of parentCount.entries()) {
    if (count === 0) roots.push(id);
  }

  const generations = new Map<string, number>();
  roots.forEach(r => generations.set(r, 0));

  const queue = [...roots];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentGen = generations.get(current)!;

    const children = childrenMap.get(current) || [];
    for (const child of children) {
      const childGen = generations.get(child) || 0;
      if (currentGen + 1 > childGen) {
        generations.set(child, currentGen + 1);
        queue.push(child);
      }
    }
  }

  return generations;
}
