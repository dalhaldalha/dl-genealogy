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
    // Group parentChildEdges by childId
    const edgesByChild = new Map<string, ParentChild[]>();
    for (const edge of parentChildEdges) {
      if (!edgesByChild.has(edge.childId)) {
        edgesByChild.set(edge.childId, []);
      }
      edgesByChild.get(edge.childId)!.push(edge);
    }

    const lines: React.ReactNode[] = [];

    edgesByChild.forEach((edges, childId) => {
      const child = positions.get(childId);
      if (!child) return;

      const isChildHighlighted = spotlightId === childId;

      if (edges.length >= 2) {
        // Child has 2 parents (Father and Mother)
        const p1Id = edges[0].parentId;
        const p2Id = edges[1].parentId;
        const p1 = positions.get(p1Id);
        const p2 = positions.get(p2Id);

        if (p1 && p2) {
          // Check if there is a union between these two specific parents
          const union = unions.find(
            (u) =>
              (u.partner1Id === p1Id && u.partner2Id === p2Id) ||
              (u.partner1Id === p2Id && u.partner2Id === p1Id)
          );

          // If union exists, anchor is marriage midpoint between these specific two parents
          let anchor: { x: number; y: number };
          if (union) {
            const marriage = calcMarriageLine(
              p1.x < p2.x ? p1 : p2,
              p1.x < p2.x ? p2 : p1
            );
            anchor = marriage.midpoint;
          } else {
            anchor = {
              x: (p1.x + p2.x + p1.width) / 2,
              y: Math.max(p1.y, p2.y) + p1.height / 2,
            };
          }

          const path = calcParentChildBezier(anchor, child);
          const isHighlighted =
            isChildHighlighted || spotlightId === p1Id || spotlightId === p2Id;

          lines.push(
            <path
              key={`pc_duo_${childId}`}
              d={path}
              stroke={isHighlighted ? '#C5A059' : '#404040'}
              strokeWidth="2"
              fill="none"
              className="transition-colors duration-200"
            />
          );
          return;
        }
      }

      // Single parent (or fallback if only 1 parent position found)
      for (const edge of edges) {
        const parent = positions.get(edge.parentId);
        if (!parent) continue;

        const anchor = {
          x: parent.x + parent.width / 2,
          y: parent.y + parent.height,
        };

        const path = calcParentChildBezier(anchor, child);
        const isHighlighted =
          isChildHighlighted || spotlightId === edge.parentId;

        lines.push(
          <path
            key={edge.id}
            d={path}
            stroke={isHighlighted ? '#C5A059' : '#404040'}
            strokeWidth="2"
            fill="none"
            className="transition-colors duration-200"
          />
        );
      }
    });

    return lines;
  }, [positions, parentChildEdges, unions, spotlightId]);

  return (
    <svg className="absolute top-0 left-0 w-full h-full overflow-visible pointer-events-none">
      {unionLines}
      {parentLines}
    </svg>
  );
});

SvgEdgeLayer.displayName = 'SvgEdgeLayer';
