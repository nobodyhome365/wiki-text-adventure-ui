import { useCallback, useState, useRef, useEffect } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/base.css';

import SceneNode from './components/SceneNode';
import EditPanel from './components/EditPanel';
import Toolbar from './components/Toolbar';
import ExportModal from './components/ExportModal';
import ImportWikitextModal from './components/ImportWikitextModal';
import { defaultNodes, defaultEdges, blankNodes, blankEdges, getInitialNextId } from './utils/defaultData';
import { exportWikitext } from './utils/wikitextExporter';
import { runAutoLayout } from './utils/autoLayout';
import { NodeActionsContext } from './contexts/NodeActionsContext';

// Must be defined outside the component to avoid re-creating on every render
const nodeTypes = { sceneNode: SceneNode };

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') ?? 'dark');
  const [filename, setFilename] = useState(() => localStorage.getItem('filename') ?? 'adventure');
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [panelWidth, setPanelWidth] = useState(300);
  const isDirtyRef = useRef(false);
  const lastSavedFilenameRef = useRef(null);
  const reactFlowInstanceRef = useRef(null);

  // Undo / redo
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const updateDebounceRef = useRef(null);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('filename', filename);
  }, [filename]);

  useEffect(() => {
    const handler = (e) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Keep refs in sync so pushUndo always snapshots the latest state
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  const pushUndo = useCallback(() => {
    undoStackRef.current.push({ nodes: nodesRef.current, edges: edgesRef.current });
    if (undoStackRef.current.length > 50) undoStackRef.current.shift();
    redoStackRef.current = [];
    setHistoryState({ canUndo: true, canRedo: false });
  }, []);

  const handleUndo = useCallback(() => {
    if (!undoStackRef.current.length) return;
    redoStackRef.current.push({ nodes: nodesRef.current, edges: edgesRef.current });
    const snap = undoStackRef.current.pop();
    setNodes(snap.nodes);
    setEdges(snap.edges);
    setSelectedNodeId(null);
    setHistoryState({ canUndo: undoStackRef.current.length > 0, canRedo: true });
  }, [setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    if (!redoStackRef.current.length) return;
    undoStackRef.current.push({ nodes: nodesRef.current, edges: edgesRef.current });
    const snap = redoStackRef.current.pop();
    setNodes(snap.nodes);
    setEdges(snap.edges);
    setSelectedNodeId(null);
    setHistoryState({ canUndo: true, canRedo: redoStackRef.current.length > 0 });
  }, [setNodes, setEdges]);

  useEffect(() => {
    const handler = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); handleRedo(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo]);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [wikitextContent, setWikitextContent] = useState('');
  const [importWikitextOpen, setImportWikitextOpen] = useState(false);
  const nextIdRef = useRef(getInitialNextId(defaultNodes));

  const selectedNode = nodes.find(n => n.id === selectedNodeId) ?? null;

  const handleNodeClick = useCallback((_, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleNodesChange = useCallback((changes) => {
    if (changes.some(c => c.type !== 'select' && c.type !== 'dimensions')) {
      isDirtyRef.current = true;
    }
    onNodesChange(changes);
  }, [onNodesChange]);

  const handleEdgesChange = useCallback((changes) => {
    if (changes.some(c => c.type !== 'select')) isDirtyRef.current = true;
    onEdgesChange(changes);
  }, [onEdgesChange]);

  const handleConnect = useCallback((connection) => {
    if (connection.source === connection.target) return;
    pushUndo();
    isDirtyRef.current = true;
    setEdges(eds => {
      const filtered = eds.filter(
        e => !(e.source === connection.source && e.sourceHandle === connection.sourceHandle)
      );
      return addEdge(connection, filtered);
    });
  }, [setEdges, pushUndo]);

  const handleAddNode = useCallback(() => {
    pushUndo();
    isDirtyRef.current = true;
    const newId = String(nextIdRef.current++);
    const jitter = (range) => (Math.random() - 0.5) * range;
    const sel = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
    let position;
    if (sel) {
      position = { x: sel.position.x + 280, y: sel.position.y + jitter(120) };
    } else {
      const { x: vpX, y: vpY, zoom } = reactFlowInstanceRef.current?.getViewport() ?? { x: 0, y: 0, zoom: 1 };
      const centerX = (-vpX + window.innerWidth / 2) / zoom;
      const centerY = (-vpY + window.innerHeight / 2) / zoom;
      position = { x: centerX + jitter(100), y: centerY + jitter(100) };
    }
    setNodes(nds => [...nds, {
      id: newId,
      type: 'sceneNode',
      position,
      data: {
        numericId: parseInt(newId, 10),
        image: '',
        title: '',
        text: '',
        imagesize: '',
        choices: [],
        isEnding: false,
        isGoodEnding: false,
      },
    }]);
  }, [nodes, selectedNodeId, setNodes, pushUndo]);

  const handleUpdateNode = useCallback((nodeId, newData) => {
    isDirtyRef.current = true;
    if (!updateDebounceRef.current) pushUndo();
    clearTimeout(updateDebounceRef.current);
    updateDebounceRef.current = setTimeout(() => { updateDebounceRef.current = null; }, 1500);
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: newData } : n));
  }, [setNodes, pushUndo]);

  const handleAddChoice = useCallback((nodeId) => {
    pushUndo();
    isDirtyRef.current = true;
    setNodes(nds => nds.map(n => {
      if (n.id !== nodeId) return n;
      return { ...n, data: { ...n.data, choices: [...n.data.choices, { text: '' }] } };
    }));
  }, [setNodes, pushUndo]);

  const handleDeleteChoice = useCallback((nodeId, choiceIndex) => {
    pushUndo();
    isDirtyRef.current = true;
    // Remove the edge for this choice and renumber edges for subsequent choices
    setEdges(eds => eds
      .filter(e => !(e.source === nodeId && e.sourceHandle === `choice-${choiceIndex}`))
      .map(e => {
        if (e.source === nodeId && e.sourceHandle) {
          const match = e.sourceHandle.match(/^choice-(\d+)$/);
          if (match) {
            const handleIdx = parseInt(match[1], 10);
            if (handleIdx > choiceIndex) {
              return { ...e, sourceHandle: `choice-${handleIdx - 1}` };
            }
          }
        }
        return e;
      })
    );
    setNodes(nds => nds.map(n => {
      if (n.id !== nodeId) return n;
      return { ...n, data: { ...n.data, choices: n.data.choices.filter((_, i) => i !== choiceIndex) } };
    }));
  }, [setEdges, setNodes, pushUndo]);

  const handleNodesDelete = useCallback((deletedNodes) => {
    pushUndo();
    isDirtyRef.current = true;
    const deletedIds = new Set(deletedNodes.map(n => n.id));
    setEdges(eds => eds.filter(e => !deletedIds.has(e.source) && !deletedIds.has(e.target)));
    if (deletedIds.has(selectedNodeId)) {
      setSelectedNodeId(null);
    }
  }, [setEdges, selectedNodeId, pushUndo]);

  const handleDeleteNode = useCallback((nodeId) => {
    if (nodeId === '0') return;
    pushUndo();
    isDirtyRef.current = true;
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNodeId(null);
  }, [setNodes, setEdges, pushUndo]);

  const clearHistory = useCallback(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    setHistoryState({ canUndo: false, canRedo: false });
  }, []);

  const handleNew = useCallback(() => {
    if (!window.confirm('Start a new project? Any unsaved changes will be lost.')) return;
    setNodes(structuredClone(blankNodes));
    setEdges(structuredClone(blankEdges));
    setSelectedNodeId(null);
    nextIdRef.current = getInitialNextId(blankNodes);
    setFilename('adventure');
    isDirtyRef.current = false;
    lastSavedFilenameRef.current = null;
    clearHistory();
  }, [setNodes, setEdges, clearHistory]);

  const handleDuplicateNode = useCallback((nodeId) => {
    const source = nodes.find(n => n.id === nodeId);
    if (!source) return;
    pushUndo();
    isDirtyRef.current = true;
    const newId = String(nextIdRef.current++);
    setNodes(nds => [...nds, {
      ...source,
      id: newId,
      selected: false,
      position: { x: source.position.x + 40, y: source.position.y + 40 },
      data: { ...source.data, numericId: parseInt(newId, 10) },
    }]);
  }, [nodes, setNodes, pushUndo]);

  const handleAutoLayout = useCallback(() => {
    pushUndo();
    isDirtyRef.current = true;
    setNodes(nds => runAutoLayout(nds, edges));
  }, [edges, setNodes, pushUndo]);

  const handleExport = useCallback(() => {
    setWikitextContent(exportWikitext(nodes, edges));
    setExportModalOpen(true);
  }, [nodes, edges]);

  const handleSaveJSON = useCallback(() => {
    if (lastSavedFilenameRef.current === filename) {
      if (!window.confirm(`Overwrite ${filename}.json?`)) return;
    }
    const blob = new Blob([JSON.stringify({ nodes, edges }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
    isDirtyRef.current = false;
    lastSavedFilenameRef.current = filename;
  }, [nodes, edges, filename]);

  const handleLoadWikitext = useCallback(({ nodes: newNodes, edges: newEdges }) => {
    setNodes(newNodes);
    setEdges(newEdges);
    setSelectedNodeId(null);
    nextIdRef.current = getInitialNextId(newNodes);
    setImportWikitextOpen(false);
    isDirtyRef.current = false;
    clearHistory();
  }, [setNodes, setEdges, clearHistory]);

  const handleLoadJSON = useCallback((parsed, loadedFilename) => {
    if (!parsed.nodes || !parsed.edges) {
      alert('Invalid adventure JSON: missing nodes or edges.');
      return;
    }
    setNodes(parsed.nodes);
    setEdges(parsed.edges);
    setSelectedNodeId(null);
    nextIdRef.current = getInitialNextId(parsed.nodes);
    if (loadedFilename) {
      setFilename(loadedFilename);
      lastSavedFilenameRef.current = loadedFilename;
    }
    isDirtyRef.current = false;
    clearHistory();
  }, [setNodes, setEdges, clearHistory]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <Toolbar
        onNew={handleNew}
        onAddNode={handleAddNode}
        onAutoLayout={handleAutoLayout}
        onExport={handleExport}
        onSaveJSON={handleSaveJSON}
        onLoadJSON={handleLoadJSON}
        onImportWikitext={() => setImportWikitextOpen(true)}
        theme={theme}
        onSetTheme={setTheme}
        filename={filename}
        onFilenameChange={setFilename}
        canUndo={historyState.canUndo}
        canRedo={historyState.canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      <NodeActionsContext.Provider value={{ onDeleteNode: handleDeleteNode, onDuplicateNode: handleDuplicateNode }}>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            onNodesDelete={handleNodesDelete}
            onNodeDragStart={pushUndo}
            nodeTypes={nodeTypes}
            onInit={(instance) => { reactFlowInstanceRef.current = instance; }}
            fitView
            deleteKeyCode="Delete"
            colorMode={theme}
          >
            <Background />
            <Controls />
            <MiniMap
              pannable
              nodeColor={node => {
                if (node.data.numericId === 0) return 'gold';
                if (node.data.isEnding && node.data.isGoodEnding) return '#27ae60';
                if (node.data.isEnding) return '#c0392b';
                return '#555';
              }}
            />
          </ReactFlow>
        </div>

        {selectedNode && (
          <EditPanel
            selectedNode={selectedNode}
            onUpdateNode={handleUpdateNode}
            onDeleteChoice={handleDeleteChoice}
            onAddChoice={handleAddChoice}
            onDeleteNode={handleDeleteNode}
            onDuplicateNode={handleDuplicateNode}
            onClose={() => setSelectedNodeId(null)}
            panelWidth={panelWidth}
            onPanelResize={setPanelWidth}
          />
        )}
      </div>
      </NodeActionsContext.Provider>

      {exportModalOpen && (
        <ExportModal
          wikitext={wikitextContent}
          onClose={() => setExportModalOpen(false)}
        />
      )}

      {importWikitextOpen && (
        <ImportWikitextModal
          onImport={handleLoadWikitext}
          onClose={() => setImportWikitextOpen(false)}
        />
      )}
    </div>
  );
}
