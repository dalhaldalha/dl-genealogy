import { useState, useEffect } from 'react';
import type { FamilyMember, ParentChild, Union, NodePosition } from '@kinfolk/shared';
import { computeTreeLayout } from '../lib/layout/elk-layout-engine';

/**
 * Hook to manage async ELK tree layout calculation
 */
export function useTreeLayout(
  members: FamilyMember[],
  parentChildEdges: ParentChild[],
  unions: Union[]
) {
  const [nodePositions, setNodePositions] = useState<Map<string, NodePosition>>(new Map());
  const [isLayoutReady, setIsLayoutReady] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    async function layout() {
      setIsLayoutReady(false);
      try {
        const positions = await computeTreeLayout(members, parentChildEdges, unions);
        if (mounted) {
          setNodePositions(positions);
          setIsLayoutReady(true);
        }
      } catch (error) {
        console.error('Error computing tree layout:', error);
      }
    }

    if (members.length > 0) {
      layout();
    } else {
      setNodePositions(new Map());
      setIsLayoutReady(true);
    }

    return () => {
      mounted = false;
    };
  }, [members, parentChildEdges, unions]);

  return { nodePositions, isLayoutReady };
}
