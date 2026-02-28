import { useCallback, useRef, useState, useEffect } from 'react';
import { UNDO_STACK_MAX, UPDATE_DEBOUNCE_MS } from '../constants';

/**
 * Encapsulates undo/redo state and handlers.
 *
 * @param {Array} nodes - current nodes (read for snapshots)
 * @param {Array} edges - current edges (read for snapshots)
 * @param {Function} setNodes - ReactFlow setter
 * @param {Function} setEdges - ReactFlow setter
 * @param {Function} setSelectedNodeId - clears selection on undo/redo
 * @returns {{ pushUndo, debouncedPushUndo, handleUndo, handleRedo, clearHistory, historyState }}
 */
export function useHistory(nodes, edges, setNodes, setEdges, setSelectedNodeId) {
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const updateDebounceRef = useRef(null);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });

  // Keep refs current so snapshots always capture the latest state
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  const pushUndo = useCallback(() => {
    undoStackRef.current.push({ nodes: nodesRef.current, edges: edgesRef.current });
    if (undoStackRef.current.length > UNDO_STACK_MAX) undoStackRef.current.shift();
    redoStackRef.current = [];
    setHistoryState({ canUndo: true, canRedo: false });
  }, []);

  /** Debounced variant — groups rapid updates (e.g. typing) into one undo step. */
  const debouncedPushUndo = useCallback(() => {
    if (!updateDebounceRef.current) pushUndo();
    clearTimeout(updateDebounceRef.current);
    updateDebounceRef.current = setTimeout(() => { updateDebounceRef.current = null; }, UPDATE_DEBOUNCE_MS);
  }, [pushUndo]);

  const handleUndo = useCallback(() => {
    if (!undoStackRef.current.length) return;
    redoStackRef.current.push({ nodes: nodesRef.current, edges: edgesRef.current });
    const snap = undoStackRef.current.pop();
    setNodes(snap.nodes);
    setEdges(snap.edges);
    setSelectedNodeId(null);
    setHistoryState({ canUndo: undoStackRef.current.length > 0, canRedo: true });
  }, [setNodes, setEdges, setSelectedNodeId]);

  const handleRedo = useCallback(() => {
    if (!redoStackRef.current.length) return;
    undoStackRef.current.push({ nodes: nodesRef.current, edges: edgesRef.current });
    const snap = redoStackRef.current.pop();
    setNodes(snap.nodes);
    setEdges(snap.edges);
    setSelectedNodeId(null);
    setHistoryState({ canUndo: true, canRedo: redoStackRef.current.length > 0 });
  }, [setNodes, setEdges, setSelectedNodeId]);

  const clearHistory = useCallback(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    setHistoryState({ canUndo: false, canRedo: false });
  }, []);

  return { pushUndo, debouncedPushUndo, handleUndo, handleRedo, clearHistory, historyState };
}
