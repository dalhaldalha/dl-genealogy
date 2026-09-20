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
  const memberMap = new Map(members.map(m => [m.id, m]));
  
  // Group spouse pairs from unions
  const unionMap = new Map<string, string>(); 
  const pairMap = new Map<string, { partner1: string; partner2: string }>();
  
  for (const union of unions) {
    unionMap.set(union.partner1Id, union.id);
    unionMap.set(union.partner2Id, union.id);
    pairMap.set(union.id, { partner1: union.partner1Id, partner2: union.partner2Id });
  }

  const nodes: ElkNode[] = [];
  const processedMembers = new Set<string>();

  // Create nodes
  for (const member of members) {
    if (processedMembers.has(member.id)) continue;

    const unionId = unionMap.get(member.id);
    if (unionId && pairMap.has(unionId)) {
      const pair = pairMap.get(unionId)!;
      // create compound node
      nodes.push({
        id: `pair_${unionId}`,
        layoutOptions: {
          'elk.algorithm': 'fixed',
          'elk.padding': '[top=0,left=0,bottom=0,right=0]',
        },
        children: [
          { id: pair.partner1, width: CARD_WIDTH, height: CARD_HEIGHT, x: 0, y: 0 },
          { id: pair.partner2, width: CARD_WIDTH, height: CARD_HEIGHT, x: CARD_WIDTH + SPOUSE_GAP, y: 0 }
        ],
        width: CARD_WIDTH * 2 + SPOUSE_GAP,
        height: CARD_HEIGHT,
      });
      processedMembers.add(pair.partner1);
      processedMembers.add(pair.partner2);
    } else {
      // Create standalone node
      nodes.push({
        id: member.id,
        width: CARD_WIDTH,
        height: CARD_HEIGHT
      });
      processedMembers.add(member.id);
    }
  }

  // Create edges
  const edges = [];
  const processedEdges = new Set<string>();
  
  for (const pc of parentChildEdges) {
    const parentUnionId = unionMap.get(pc.parentId);
    const sourceId = parentUnionId ? `pair_${parentUnionId}` : pc.parentId;
    const targetUnionId = unionMap.get(pc.childId);
    const targetId = targetUnionId ? `pair_${targetUnionId}` : pc.childId;
    
    const edgeId = `${sourceId}_${targetId}`;
    if (!processedEdges.has(edgeId)) {
      edges.push({
        id: edgeId,
        sources: [sourceId],
        targets: [targetId]
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
