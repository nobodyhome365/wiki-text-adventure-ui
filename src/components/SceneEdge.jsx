import { getBezierPath, BaseEdge } from '@xyflow/react';

export default function SceneEdge({
  id,
  sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
  style,
  markerEnd,
}) {
  let edgePath;

  if (targetX < sourceX) {
    // Backwards edge: target is to the left of source.
    // Push control points outward horizontally so the curve arcs wide
    // instead of cutting back through the source node.
    const hGap = Math.max(80, (sourceX - targetX) * 0.5);
    edgePath = `M ${sourceX} ${sourceY} C ${sourceX + hGap} ${sourceY} ${targetX - hGap} ${targetY} ${targetX} ${targetY}`;
  } else {
    [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  }

  return <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />;
}
