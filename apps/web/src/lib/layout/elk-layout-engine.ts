import ELK, { type ElkNode } from 'elkjs/lib/elk.bundled.js';
import type { FamilyMember, ParentChild, Union, NodePosition } from '@kinfolk/shared';

const elk = new ELK();

const CARD_WIDTH = 270;
const CARD_HEIGHT = 160;
const GENERATION_GAP = 340;
const SIBLING_GAP = 60;
const SPOUSE_GAP = 80;

/**
 * Computes tree positions for members using ELK layout engine
 */
export async function computeTreeLayout(
  members: FamilyMember[],
  parentChildEdges: ParentChild[],
  unions: Union[]
): Promise<Map<string, NodePosition>> {
  const memberMap = new Map(members.map((m) => [m.id, m]));

  // Build spouse adjacency graph
  const spouseGraph = new Map<string, Set<string>>();
  for (const union of unions) {
    if (!spouseGraph.has(union.partner1Id)) spouseGraph.set(union.partner1Id, new Set());
    if (!spouseGraph.has(union.partner2Id)) spouseGraph.set(union.partner2Id, new Set());
    spouseGraph.get(union.partner1Id)!.add(union.partner2Id);
    spouseGraph.get(union.partner2Id)!.add(union.partner1Id);
  }

  // Find connected spouse clusters (supports 1 husband with multiple wives or standard pairs)
  const memberToClusterId = new Map<string, string>();
  const clusters: Array<{ id: string; members: string[] }> = [];
  const visited = new Set<string>();

  for (const member of members) {
    if (visited.has(member.id)) continue;
    const spouses = spouseGraph.get(member.id);
    if (spouses && spouses.size > 0) {
      const clusterMembers: string[] = [];
      const queue = [member.id];
      visited.add(member.id);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        clusterMembers.push(curr);
        const nextSpouses = spouseGraph.get(curr);
        if (nextSpouses) {
          for (const s of nextSpouses) {
            if (!visited.has(s)) {
              visited.add(s);
              queue.push(s);
            }
          }
        }
      }

      // Count connections within cluster to find hub member (e.g. husband with multiple wives)
      const connectionCount = new Map<string, number>();
      for (const mId of clusterMembers) {
        const spouses = spouseGraph.get(mId);
        let count = 0;
        if (spouses) {
          for (const s of spouses) {
            if (clusterMembers.includes(s)) count++;
          }
        }
        connectionCount.set(mId, count);
      }

      const sortedByHub = [...clusterMembers].sort((a, b) => {
        const cntDiff = (connectionCount.get(b) || 0) - (connectionCount.get(a) || 0);
        if (cntDiff !== 0) return cntDiff;
        const mA = memberMap.get(a);
        const mB = memberMap.get(b);
        if (mA?.gender === 'male' && mB?.gender !== 'male') return -1;
        if (mB?.gender === 'male' && mA?.gender !== 'male') return 1;
        return 0;
      });

      const hubId = sortedByHub[0];
      const otherMembers = clusterMembers.filter((m) => m !== hubId);

      let orderedCluster: string[] = [];
      if (otherMembers.length <= 1) {
        // Standard couple: male first if present
        orderedCluster = [hubId, ...otherMembers];
        const m0 = memberMap.get(orderedCluster[0]);
        const m1 = memberMap.get(orderedCluster[1]);
        if (m1?.gender === 'male' && m0?.gender !== 'male') {
          orderedCluster = [orderedCluster[1], orderedCluster[0]];
        }
      } else if (otherMembers.length === 2) {
        // Exactly 2 wives: center the husband: [Wife 1, Husband, Wife 2]
        orderedCluster = [otherMembers[0], hubId, otherMembers[1]];
      } else {
        // 3 or more wives: alternate wives around husband: [W2, W0, Hub, W1, W3, ...]
        const leftSide: string[] = [];
        const rightSide: string[] = [];
        otherMembers.forEach((m, idx) => {
          if (idx % 2 === 0) {
            leftSide.unshift(m);
          } else {
            rightSide.push(m);
          }
        });
        orderedCluster = [...leftSide, hubId, ...rightSide];
      }

      const clusterId = `family_${hubId}`;
      clusters.push({ id: clusterId, members: orderedCluster });
      for (const mId of orderedCluster) {
        memberToClusterId.set(mId, clusterId);
      }
    } else {
      visited.add(member.id);
    }
  }

  // Map member to their index inside their cluster
  const memberToClusterIndex = new Map<string, number>();
  for (const cluster of clusters) {
    cluster.members.forEach((mId, idx) => {
      memberToClusterIndex.set(mId, idx);
    });
  }

  const nodes: ElkNode[] = [];
  const processedMembers = new Set<string>();

  // Add multi-spouse/couple compound nodes
  for (const cluster of clusters) {
    const children = cluster.members.map((mId, idx) => ({
      id: mId,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      x: idx * (CARD_WIDTH + SPOUSE_GAP),
      y: 0,
    }));

    nodes.push({
      id: cluster.id,
      layoutOptions: {
        'elk.algorithm': 'fixed',
        'elk.padding': '[top=0,left=0,bottom=0,right=0]',
      },
      children,
      width: cluster.members.length * CARD_WIDTH + (cluster.members.length - 1) * SPOUSE_GAP,
      height: CARD_HEIGHT,
    });

    for (const mId of cluster.members) {
      processedMembers.add(mId);
    }
  }

  // Add standalone nodes
  for (const member of members) {
    if (processedMembers.has(member.id)) continue;
    nodes.push({
      id: member.id,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    });
    processedMembers.add(member.id);
  }

  // Helper to determine a child's parent horizontal index in a cluster
  const getChildClusterIndex = (childId: string, clusterId: string): number => {
    const parents = parentChildEdges.filter((pc) => pc.childId === childId);
    // 1. Prefer female parent (mother) in cluster
    for (const p of parents) {
      const pMember = memberMap.get(p.parentId);
      if (pMember?.gender === 'female' && memberToClusterId.get(p.parentId) === clusterId) {
        return memberToClusterIndex.get(p.parentId) ?? 0;
      }
    }
    // 2. Fallback to any parent in cluster
    for (const p of parents) {
      if (memberToClusterId.get(p.parentId) === clusterId) {
        return memberToClusterIndex.get(p.parentId) ?? 0;
      }
    }
    return 0;
  };

  // Sort parentChildEdges so children are ordered by their mother's cluster position
  const sortedParentChildEdges = [...parentChildEdges].sort((a, b) => {
    const parentClusterA = memberToClusterId.get(a.parentId) || a.parentId;
    const parentClusterB = memberToClusterId.get(b.parentId) || b.parentId;
    if (parentClusterA !== parentClusterB) return parentClusterA.localeCompare(parentClusterB);

    const idxA = getChildClusterIndex(a.childId, parentClusterA);
    const idxB = getChildClusterIndex(b.childId, parentClusterB);
    if (idxA !== idxB) return idxA - idxB;

    const childA = memberMap.get(a.childId);
    const childB = memberMap.get(b.childId);
    if (childA?.dateOfBirth && childB?.dateOfBirth) {
      return childA.dateOfBirth.localeCompare(childB.dateOfBirth);
    }
    return (childA?.firstName || '').localeCompare(childB?.firstName || '');
  });

  // Create edges with self-loop and cycle prevention
  const edges = [];
  const processedEdges = new Set<string>();
  const adj = new Map<string, Set<string>>();

  const hasPath = (start: string, target: string, visited = new Set<string>()): boolean => {
    if (start === target) return true;
    visited.add(start);
    const neighbors = adj.get(start);
    if (neighbors) {
      for (const n of neighbors) {
        if (!visited.has(n) && hasPath(n, target, visited)) {
          return true;
        }
      }
    }
    return false;
  };

  for (const pc of sortedParentChildEdges) {
    const parentClusterId = memberToClusterId.get(pc.parentId);
    const sourceId = parentClusterId || pc.parentId;
    const childClusterId = memberToClusterId.get(pc.childId);
    const targetId = childClusterId || pc.childId;

    // Prevent self-loops
    if (sourceId === targetId) continue;

    // Prevent cycles in ELK layered graph
    if (hasPath(targetId, sourceId)) continue;

    const edgeId = `${sourceId}_${targetId}`;
    if (!processedEdges.has(edgeId)) {
      edges.push({
        id: edgeId,
        sources: [sourceId],
        targets: [targetId],
      });
      processedEdges.add(edgeId);

      if (!adj.has(sourceId)) adj.set(sourceId, new Set());
      adj.get(sourceId)!.add(targetId);
    }
  }

  const graph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.spacing.nodeNode': SIBLING_GAP.toString(),
      'elk.layered.spacing.nodeNodeBetweenLayers': GENERATION_GAP.toString(),
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
    },
    children: nodes,
    edges: edges
  };

  const result = await elk.layout(graph);
  
  const positions = new Map<string, NodePosition>();
  
  const extractPositions = (node: ElkNode, offsetX = 0, offsetY = 0) => {
    const x = offsetX + (node.x || 0);
    const y = offsetY + (node.y || 0);
    
    // Only map actual family member nodes, never compound cluster containers
    if (memberMap.has(node.id)) {
      const member = memberMap.get(node.id)!;
      const gen = member.generation && member.generation >= 1 ? member.generation : 1;
      const expectedY = 12 + (gen - 1) * (CARD_HEIGHT + GENERATION_GAP);
      
      // Pin Y strictly to the generation row so disconnected nodes or complex subgraphs
      // never scramble generation rows or disrupt banners
      const finalY = expectedY;

      positions.set(node.id, {
        x,
        y: finalY,
        width: node.width || CARD_WIDTH,
        height: node.height || CARD_HEIGHT
      });
    }
    
    if (node.children) {
      for (const child of node.children) {
        extractPositions(child, x, y);
      }
    }
  };

  extractPositions(result);
  return positions;
}
