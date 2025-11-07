import dagre from "dagre";

/**
 * Auto-layout nodes using dagre algorithm
 * @param {Array} nodes - Array of React Flow nodes
 * @param {Array} edges - Array of React Flow edges
 * @param {Object} options - Layout options
 * @returns {Array} - Array of nodes with updated positions
 */
export const getLayoutedNodes = (nodes, edges, options = {}) => {
  const {
    direction = "TB", // TB (top-bottom), LR (left-right), BT, RL
    nodeWidth = 200,
    nodeHeight = 80,
    rankSep = 80,
    nodeSep = 50,
  } = options;

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: rankSep,
    nodesep: nodeSep,
  });

  // Add nodes to dagre
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // Add edges to dagre
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Update nodes with new positions
  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });
};

/**
 * Align nodes horizontally
 * @param {Array} selectedNodes - Array of selected nodes
 * @param {string} alignment - "left", "center", or "right"
 * @returns {Array} - Array of nodes with updated positions
 */
export const alignNodesHorizontally = (selectedNodes, alignment = "center") => {
  if (selectedNodes.length < 2) return selectedNodes;

  let referenceY;

  switch (alignment) {
    case "top":
      referenceY = Math.min(...selectedNodes.map((n) => n.position.y));
      break;
    case "bottom":
      referenceY = Math.max(...selectedNodes.map((n) => n.position.y));
      break;
    case "center":
    default:
      const minY = Math.min(...selectedNodes.map((n) => n.position.y));
      const maxY = Math.max(...selectedNodes.map((n) => n.position.y));
      referenceY = (minY + maxY) / 2;
      break;
  }

  return selectedNodes.map((node) => ({
    ...node,
    position: { ...node.position, y: referenceY },
  }));
};

/**
 * Align nodes vertically
 * @param {Array} selectedNodes - Array of selected nodes
 * @param {string} alignment - "left", "center", or "right"
 * @returns {Array} - Array of nodes with updated positions
 */
export const alignNodesVertically = (selectedNodes, alignment = "center") => {
  if (selectedNodes.length < 2) return selectedNodes;

  let referenceX;

  switch (alignment) {
    case "left":
      referenceX = Math.min(...selectedNodes.map((n) => n.position.x));
      break;
    case "right":
      referenceX = Math.max(...selectedNodes.map((n) => n.position.x));
      break;
    case "center":
    default:
      const minX = Math.min(...selectedNodes.map((n) => n.position.x));
      const maxX = Math.max(...selectedNodes.map((n) => n.position.x));
      referenceX = (minX + maxX) / 2;
      break;
  }

  return selectedNodes.map((node) => ({
    ...node,
    position: { ...node.position, x: referenceX },
  }));
};

/**
 * Distribute nodes evenly horizontally
 * @param {Array} selectedNodes - Array of selected nodes
 * @returns {Array} - Array of nodes with updated positions
 */
export const distributeNodesHorizontally = (selectedNodes) => {
  if (selectedNodes.length < 3) return selectedNodes;

  const sorted = [...selectedNodes].sort((a, b) => a.position.x - b.position.x);
  const minX = sorted[0].position.x;
  const maxX = sorted[sorted.length - 1].position.x;
  const gap = (maxX - minX) / (sorted.length - 1);

  return sorted.map((node, index) => ({
    ...node,
    position: { ...node.position, x: minX + gap * index },
  }));
};

/**
 * Distribute nodes evenly vertically
 * @param {Array} selectedNodes - Array of selected nodes
 * @returns {Array} - Array of nodes with updated positions
 */
export const distributeNodesVertically = (selectedNodes) => {
  if (selectedNodes.length < 3) return selectedNodes;

  const sorted = [...selectedNodes].sort((a, b) => a.position.y - b.position.y);
  const minY = sorted[0].position.y;
  const maxY = sorted[sorted.length - 1].position.y;
  const gap = (maxY - minY) / (sorted.length - 1);

  return sorted.map((node, index) => ({
    ...node,
    position: { ...node.position, y: minY + gap * index },
  }));
};
