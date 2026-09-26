import type { FamilyMember, ParentChild, Union } from '@kinfolk/shared';

export interface KinshipResult {
  relationship: string;
  path: string[];
  degree: number;
  description: string;
}

export interface PathEdge {
  memberId: string;
  edgeType: 'parent' | 'child' | 'spouse';
}

function nameRelationship(path: PathEdge[], members: Map<string, FamilyMember>): string {
  let up = 0;
  let down = 0;
  let spouses = 0;

  for (const p of path) {
    if (p.edgeType === 'parent') up++;
    else if (p.edgeType === 'child') down++;
    else if (p.edgeType === 'spouse') spouses++;
  }

  const targetMember = members.get(path[path.length - 1].memberId);
  const targetGender = targetMember?.gender || 'male';

  const isMale = targetGender === 'male';

  if (spouses > 1) return 'Distant Relative by Marriage';
  
  if (spouses === 1) {
    if (up === 0 && down === 0) return isMale ? 'Husband' : 'Wife';
    if (up === 1 && down === 0) return isMale ? 'Father-in-law' : 'Mother-in-law';
    if (up === 0 && down === 1) return isMale ? 'Son-in-law' : 'Daughter-in-law';
    if (up === 1 && down === 1) return isMale ? 'Brother-in-law' : 'Sister-in-law';
    return 'Relative by Marriage';
  }

  // Direct line up
  if (up > 0 && down === 0) {
    if (up === 1) return isMale ? 'Father' : 'Mother';
    if (up === 2) return isMale ? 'Grandfather' : 'Grandmother';
    return 'Great-'.repeat(up - 2) + (isMale ? 'Grandfather' : 'Grandmother');
  }

  // Direct line down
  if (up === 0 && down > 0) {
    if (down === 1) return isMale ? 'Son' : 'Daughter';
    if (down === 2) return isMale ? 'Grandson' : 'Granddaughter';
    return 'Great-'.repeat(down - 2) + (isMale ? 'Grandson' : 'Granddaughter');
  }

  // Same generation
  if (up === 1 && down === 1) return isMale ? 'Brother' : 'Sister';

  // Uncles/Aunts
  if (up >= 2 && down === 1) {
    if (up === 2) return isMale ? 'Uncle' : 'Aunt';
    return 'Great-'.repeat(up - 2) + (isMale ? 'Uncle' : 'Aunt');
  }

  // Nephews/Nieces
  if (up === 1 && down >= 2) {
    if (down === 2) return isMale ? 'Nephew' : 'Niece';
    return 'Great-'.repeat(down - 2) + (isMale ? 'Nephew' : 'Niece');
  }

  // Cousins
  if (up >= 2 && down >= 2) {
    const cousinDegree = Math.min(up, down) - 1;
    const removed = Math.abs(up - down);
    
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = cousinDegree % 100;
    const suffix = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
    
    let degreeStr = `${cousinDegree}${suffix}`;
    if (cousinDegree === 1) degreeStr = 'First';
    if (cousinDegree === 2) degreeStr = 'Second';
    if (cousinDegree === 3) degreeStr = 'Third';
    if (cousinDegree === 4) degreeStr = 'Fourth';
    if (cousinDegree === 5) degreeStr = 'Fifth';

    if (removed === 0) return `${degreeStr} Cousin`;
    
    const timesMap = ['Once', 'Twice', 'Three times', 'Four times', 'Five times'];
    const timesStr = timesMap[removed - 1] || `${removed} times`;
    
    return `${degreeStr} Cousin ${timesStr} Removed`;
  }

  return 'Relative';
}

export function findKinship(
  memberAId: string,
  memberBId: string,
  members: FamilyMember[],
  parentChildEdges: ParentChild[],
  unions: Union[]
): KinshipResult | null {
  if (memberAId === memberBId) return null;

  const adj = new Map<string, PathEdge[]>();
  const membersMap = new Map<string, FamilyMember>();

  for (const m of members) {
    adj.set(m.id, []);
    membersMap.set(m.id, m);
  }

  for (const pc of parentChildEdges) {
    if (adj.has(pc.childId)) {
      adj.get(pc.childId)!.push({ memberId: pc.parentId, edgeType: 'parent' });
    }
    if (adj.has(pc.parentId)) {
      adj.get(pc.parentId)!.push({ memberId: pc.childId, edgeType: 'child' });
    }
  }

  for (const u of unions) {
    if (adj.has(u.partner1Id) && adj.has(u.partner2Id)) {
      adj.get(u.partner1Id)!.push({ memberId: u.partner2Id, edgeType: 'spouse' });
      adj.get(u.partner2Id)!.push({ memberId: u.partner1Id, edgeType: 'spouse' });
    }
  }

  const queue: { currentId: string; path: PathEdge[] }[] = [];
  const visited = new Set<string>();

  queue.push({ currentId: memberAId, path: [] });
  visited.add(memberAId);

  let resultPath: PathEdge[] | null = null;

  while (queue.length > 0) {
    const { currentId, path } = queue.shift()!;

    if (currentId === memberBId) {
      resultPath = path;
      break;
    }

    const neighbors = adj.get(currentId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.memberId)) {
        visited.add(neighbor.memberId);
        queue.push({
          currentId: neighbor.memberId,
          path: [...path, neighbor],
        });
      }
    }
  }

  if (!resultPath) return null;

  const relationship = nameRelationship(resultPath, membersMap);
  const pathIds = [memberAId, ...resultPath.map((p) => p.memberId)];
  const degree = resultPath.length;

  const memberA = membersMap.get(memberAId);
  const memberB = membersMap.get(memberBId);
  
  const descA = memberA ? `${memberA.firstName} ${memberA.lastName}` : 'Member A';
  const descB = memberB ? `${memberB.firstName} ${memberB.lastName}` : 'Member B';
  const description = `${descB} is the ${relationship.toLowerCase()} of ${descA}.`;

  return {
    relationship,
    path: pathIds,
    degree,
    description,
  };
}
