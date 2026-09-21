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

      // Sort cluster: male partner (husband) first, then wives
      clusterMembers.sort((a, b) => {
        const mA = memberMap.get(a);
        const mB = memberMap.get(b);
        if (mA?.gender === 'male' && mB?.gender !== 'male') return -1;
        if (mB?.gender === 'male' && mA?.gender !== 'male') return 1;
        return 0;
      });

      const clusterId = `family_${clusterMembers[0]}`;
      clusters.push({ id: clusterId, members: clusterMembers });
      for (const mId of clusterMembers) {
        memberToClusterId.set(mId, clusterId);
      }
    } else {
      visited.add(member.id);
    }
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

  // Create edges
  const edges = [];
  const processedEdges = new Set<string>();

  for (const pc of parentChildEdges) {
    const parentClusterId = memberToClusterId.get(pc.parentId);
    const sourceId = parentClusterId || pc.parentId;
    const childClusterId = memberToClusterId.get(pc.childId);
    const targetId = childClusterId || pc.childId;

    const edgeId = `${sourceId}_${targetId}`;
    if (!processedEdges.has(edgeId)) {
      edges.push({
        id: edgeId,
        sources: [sourceId],
        targets: [targetId],
      });
      processedEdges.add(edgeId);
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
    
    if (node.id !== 'root' && !node.id.startsWith('pair_')) {
      positions.set(node.id, {
        x,
        y,
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
