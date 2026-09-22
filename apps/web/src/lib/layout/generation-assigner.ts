import type { FamilyMember, ParentChild, Union } from '@kinfolk/shared';

/**
 * Converts any positive integer to Roman numerals (I, II, III, IV, V, VI, etc.)
 */
export function toRoman(num: number): string {
  if (num <= 0) return String(num);
  const romanLookup: [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let result = '';
  let n = Math.floor(num);
  for (const [val, roman] of romanLookup) {
    while (n >= val) {
      result += roman;
      n -= val;
    }
  }
  return result || String(num);
}

const ORDINALS = [
  '',
  'First',
  'Second',
  'Third',
  'Fourth',
  'Fifth',
  'Sixth',
  'Seventh',
  'Eighth',
  'Ninth',
  'Tenth',
  'Eleventh',
  'Twelfth',
  'Thirteenth',
  'Fourteenth',
  'Fifteenth',
];

/**
 * Generates a dynamic generation label with title and real birth year span
 * e.g. "Founding Ancestors (1974 – 1984)" or "Second Generation (2010 – 2016)"
 */
export function getDynamicGenerationLabel(
  generation: number,
  membersInGen: FamilyMember[]
): string {
  let title = '';
  if (generation === 1) {
    title = 'Founding Ancestors';
  } else if (generation === 2) {
    title = 'Second Generation';
  } else if (generation === 3) {
    title = 'Third Generation';
  } else if (generation === 4) {
    title = 'Fourth Generation';
  } else {
    title = `${ORDINALS[generation] || `${generation}th`} Generation`;
  }

  // Calculate actual birth year span from members in this generation
  const validYears: number[] = [];
  membersInGen.forEach((m) => {
    if (m.dateOfBirth) {
      const year = new Date(m.dateOfBirth).getFullYear();
      if (!isNaN(year) && year > 1000 && year < 2200) {
        validYears.push(year);
      }
    }
  });

  if (validYears.length > 0) {
    const minYear = Math.min(...validYears);
    const maxYear = Math.max(...validYears);
    const yearSpan = minYear === maxYear ? `${minYear}` : `${minYear} – ${maxYear}`;
    return `${title} (${yearSpan})`;
  }

  return title;
}

/**
 * Assigns generations (1-indexed) dynamically to all nodes via BFS
 * Root ancestors (those with no parents in tree) = Generation 1
 * Children = Generation 2, Grandchildren = Generation 3, etc.
 * Spouses who have no parents are automatically aligned with their partner's generation.
 */
export function computeDynamicGenerations(
  members: FamilyMember[],
  parentChildEdges: ParentChild[],
  unions: Union[] = []
): Map<string, number> {
  const memberIds = new Set(members.map((m) => m.id));
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string[]>();

  members.forEach((m) => {
    childrenMap.set(m.id, []);
    parentMap.set(m.id, []);
  });

  parentChildEdges.forEach((edge) => {
    if (memberIds.has(edge.parentId) && memberIds.has(edge.childId)) {
      childrenMap.get(edge.parentId)!.push(edge.childId);
      parentMap.get(edge.childId)!.push(edge.parentId);
    }
  });

  // Spouse adjacency
  const spouseMap = new Map<string, string[]>();
  members.forEach((m) => spouseMap.set(m.id, []));
  unions.forEach((u) => {
    if (memberIds.has(u.partner1Id) && memberIds.has(u.partner2Id)) {
      spouseMap.get(u.partner1Id)!.push(u.partner2Id);
      spouseMap.get(u.partner2Id)!.push(u.partner1Id);
    }
  });

  const generations = new Map<string, number>();

  // Find root ancestors (no parents in tree)
  const roots: string[] = [];
  members.forEach((m) => {
    const parents = parentMap.get(m.id) || [];
    if (parents.length === 0) {
      roots.push(m.id);
    }
  });

  // All initial roots start at Generation 1
  roots.forEach((r) => generations.set(r, 1));

  // BFS propagation down the parent-child graph with cycle guard
  const MAX_GEN = 30;
  const visitCounts = new Map<string, number>();
  const queue = [...roots];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentGen = generations.get(current) || 1;

    const children = childrenMap.get(current) || [];
    for (const child of children) {
      const childGen = generations.get(child) || 0;
      const count = (visitCounts.get(child) || 0) + 1;
      visitCounts.set(child, count);

      if (count <= 10 && currentGen + 1 > childGen && currentGen + 1 <= MAX_GEN) {
        generations.set(child, currentGen + 1);
        queue.push(child);
      }
    }
  }

  // Fallback for any members not reached (e.g. isolated cycles or disconnected nodes)
  for (const m of members) {
    if (!generations.has(m.id)) {
      generations.set(m.id, m.generation && m.generation >= 1 ? m.generation : 1);
    }
  }

  // Spouses without parents in the tree align to their partner's generation
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 5) {
    changed = false;
    iterations++;
    for (const m of members) {
      const parents = parentMap.get(m.id) || [];
      if (parents.length === 0) {
        const spouses = spouseMap.get(m.id) || [];
        for (const spouseId of spouses) {
          const spouseGen = generations.get(spouseId);
          const currentGen = generations.get(m.id) || 1;
          if (spouseGen !== undefined && spouseGen > currentGen) {
            generations.set(m.id, spouseGen);
            changed = true;

            // Propagate down to all descendants of m
            const descQueue = [...(childrenMap.get(m.id) || [])];
            const descVisits = new Map<string, number>();
            while (descQueue.length > 0) {
              const c = descQueue.shift()!;
              const cParents = parentMap.get(c) || [];
              const maxParentGen = Math.max(
                ...cParents.map((pid) => generations.get(pid) || 1)
              );
              const targetGen = maxParentGen + 1;
              const currentCGen = generations.get(c) || 1;
              if (targetGen > currentCGen && targetGen <= MAX_GEN) {
                generations.set(c, targetGen);
                const cCount = (descVisits.get(c) || 0) + 1;
                descVisits.set(c, cCount);
                if (cCount <= 5) {
                  const grandchildren = childrenMap.get(c) || [];
                  descQueue.push(...grandchildren);
                }
              }
            }
          }
        }
      }
    }
  }

  return generations;
}

/**
 * Computes all descendants (children, grandchildren, etc.) of a member
 * to prevent selecting descendants as parents (which would cause ancestral cycles).
 */
export function getDescendantIds(memberId: string, parentChildEdges: ParentChild[]): Set<string> {
  const descendants = new Set<string>();
  const childrenMap = new Map<string, string[]>();

  parentChildEdges.forEach((edge) => {
    if (!childrenMap.has(edge.parentId)) childrenMap.set(edge.parentId, []);
    childrenMap.get(edge.parentId)!.push(edge.childId);
  });

  const queue = [...(childrenMap.get(memberId) || [])];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (!descendants.has(curr)) {
      descendants.add(curr);
      const kids = childrenMap.get(curr) || [];
      for (const k of kids) {
        if (!descendants.has(k)) {
          queue.push(k);
        }
      }
    }
  }

  return descendants;
}

/**
 * Backward-compatible alias
 */
export function assignGenerations(
  members: FamilyMember[],
  parentChildEdges: ParentChild[]
): Map<string, number> {
  return computeDynamicGenerations(members, parentChildEdges, []);
}
