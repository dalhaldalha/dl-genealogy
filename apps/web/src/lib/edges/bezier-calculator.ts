import type { NodePosition } from '@kinfolk/shared';

interface Point { x: number; y: number; }

/**
 * Calculate parent-child bezier curve string
 */
export function calcParentChildBezier(parentAnchor: Point, childAnchor: Point & { width?: number }): string {
  // If child position includes width, land accurately on the card's top-center
  const childX = childAnchor.width ? childAnchor.x + childAnchor.width / 2 : childAnchor.x;
  const midY = parentAnchor.y + (childAnchor.y - parentAnchor.y) / 2;
  return `M ${parentAnchor.x} ${parentAnchor.y} C ${parentAnchor.x} ${midY}, ${childX} ${midY}, ${childX} ${childAnchor.y}`;
}

/**
 * Calculate straight line or under-card bridge curve and midpoint between marriage nodes
 */
export function calcMarriageLine(leftPos: NodePosition, rightPos: NodePosition): { path: string; midpoint: Point } {
  const startX = leftPos.x + leftPos.width;
  const startY = leftPos.y + leftPos.height / 2;
  const endX = rightPos.x;
  const endY = rightPos.y + rightPos.height / 2;

  const gap = rightPos.x - startX;
  const sameRow = Math.abs(leftPos.y - rightPos.y) < 10;

  // If cards are separated by another card in between, route curve below to avoid card collision
  if (sameRow && gap > 110) {
    const archY = leftPos.y + leftPos.height + 24;
    const midX = (startX + endX) / 2;
    const curveStartX = startX - 10;
    const curveEndX = endX + 10;

    return {
      path: `M ${curveStartX} ${startY} C ${startX + 40} ${archY}, ${midX - 40} ${archY}, ${midX} ${archY} C ${midX + 40} ${archY}, ${endX - 40} ${archY}, ${curveEndX} ${endY}`,
      midpoint: { x: midX, y: archY }
    };
  }

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
