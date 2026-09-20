import type { NodePosition } from '@kinfolk/shared';

interface Point { x: number; y: number; }

/**
 * Calculate parent-child bezier curve string
 */
export function calcParentChildBezier(parentAnchor: Point, childAnchor: Point): string {
  const midY = parentAnchor.y + (childAnchor.y - parentAnchor.y) / 2;
  return `M ${parentAnchor.x} ${parentAnchor.y} C ${parentAnchor.x} ${midY}, ${childAnchor.x} ${midY}, ${childAnchor.x} ${childAnchor.y}`;
}

/**
 * Calculate straight line and midpoint between marriage nodes
 */
export function calcMarriageLine(leftPos: NodePosition, rightPos: NodePosition): { path: string; midpoint: Point } {
  const startX = leftPos.x + leftPos.width;
  const startY = leftPos.y + leftPos.height / 2;
  const endX = rightPos.x;
  const endY = rightPos.y + rightPos.height / 2;

  return {
    path: `M ${startX} ${startY} L ${endX} ${endY}`,
    midpoint: { x: (startX + endX) / 2, y: (startY + endY) / 2 }
  };
}

/**
 * Get anchor point for parent outgoing edge
 */
export function getParentAnchor(parent: NodePosition, spouse?: NodePosition | null): Point {
  if (spouse) {
    return {
      x: (parent.x + spouse.x + parent.width) / 2,
      y: Math.max(parent.y, spouse.y) + parent.height / 2
    };
  }
  return {
    x: parent.x + parent.width / 2,
    y: parent.y + parent.height
  };
}
