import React, { memo, useMemo } from 'react';
import { calcParentChildBezier, calcMarriageLine, getParentAnchor } from '@/lib/edges/bezier-calculator';
import type { Union, ParentChild, NodePosition } from '@kinfolk/shared';

interface SvgEdgeLayerProps {
  positions: Map<string, NodePosition>;
  unions: Union[];
  parentChildEdges: ParentChild[];
  spotlightId: string | null;
}

export const SvgEdgeLayer: React.FC<SvgEdgeLayerProps> = memo(({ positions, unions, parentChildEdges, spotlightId }) => {
  const unionLines = useMemo(() => {
    return unions.map(union => {
      const p1 = positions.get(union.partner1Id);
      const p2 = positions.get(union.partner2Id);
      if (!p1 || !p2) return null;
      
      const { path, midpoint } = calcMarriageLine(p1, p2);
      const isHighlighted = spotlightId && (spotlightId === union.partner1Id || spotlightId === union.partner2Id);
      
      return (
        <g key={union.id} className={isHighlighted ? 'highlight' : ''}>
          <path
            d={path}
            stroke={isHighlighted ? '#C5A059' : '#404040'}
            strokeWidth="2"
            fill="none"
            className="transition-colors duration-200"
          />
          <circle
            cx={midpoint.x}
            cy={midpoint.y}
            r={7}
            fill="#C5A059"
          />
        </g>
      );
    });
  }, [positions, unions, spotlightId]);

  const parentLines = useMemo(() => {
    return parentChildEdges.map(edge => {
      const child = positions.get(edge.childId);
      const parent = positions.get(edge.parentId);
      if (!child || !parent) return null;
      
      const spouseUnion = unions.find(u => u.partner1Id === edge.parentId || u.partner2Id === edge.parentId);
      const spouseId = spouseUnion ? (spouseUnion.partner1Id === edge.parentId ? spouseUnion.partner2Id : spouseUnion.partner1Id) : undefined;
      const unionPosition = spouseId ? positions.get(spouseId) : undefined;
      const anchor = getParentAnchor(parent, unionPosition);
      const path = calcParentChildBezier(anchor, child);
      const isHighlighted = spotlightId && (spotlightId === edge.childId || spotlightId === edge.parentId);
      
      return (
        <path
          key={edge.id}
          d={path}
          stroke={isHighlighted ? '#C5A059' : '#404040'}
          strokeWidth="2"
          fill="none"
          className="transition-colors duration-200"
        />
      );
    });
  }, [positions, parentChildEdges, spotlightId]);

  return (
    <svg className="absolute top-0 left-0 w-full h-full overflow-visible pointer-events-none">
      {unionLines}
      {parentLines}
    </svg>
  );
});

SvgEdgeLayer.displayName = 'SvgEdgeLayer';
