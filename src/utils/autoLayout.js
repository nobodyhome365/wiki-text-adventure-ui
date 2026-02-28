import dagre from 'dagre';
import { NODE_LAYOUT_WIDTH, NODE_LAYOUT_HEIGHT } from '../constants';

/**
 * Runs dagre top-to-bottom layout on the given nodes and edges.
 * Returns a new nodes array with updated positions. Does not mutate inputs.
 * @param {Array} nodes - React Flow node objects
 * @param {Array} edges - React Flow edge objects
 * @returns {Array} nodes with updated position values
 */
export function runAutoLayout(nodes, edges) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: 'LR',
    ranksep: 100,
    nodesep: 60,
  });

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_LAYOUT_WIDTH, height: NODE_LAYOUT_HEIGHT });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map(node => {
    const dagreNode = g.node(node.id);
    return {
      ...node,
      position: {
        x: dagreNode.x - NODE_LAYOUT_WIDTH / 2,
        y: dagreNode.y - NODE_LAYOUT_HEIGHT / 2,
      },
    };
  });
}
