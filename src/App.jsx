import { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { useHistory } from './hooks/useHistory';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/base.css';

import SceneNode from './components/SceneNode';
import SceneEdge from './components/SceneEdge';
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
const edgeTypes = { default: SceneEdge };

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') ?? 'dark');
  const [filename, setFilename] = useState(() => localStorage.getItem('filename') ?? 'adventure');
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [panelWidth, setPanelWidth] = useState(300);
  const isDirtyRef = useRef(false);
  const fileHandleRef = useRef(null);   // FileSystemFileHandle when File System Access API is available
  const reactFlowInstanceRef = useRef(null);
  const [saveFlash, setSaveFlash] = useState(false);
  const saveFlashTimerRef = useRef(null);

  const { pushUndo, debouncedPushUndo, handleUndo, handleRedo, clearHistory, historyState } = useHistory(
    nodes, edges, setNodes, setEdges, setSelectedNodeId
  );

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

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { setSelectedNodeId(null); return; }
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
    debouncedPushUndo();
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: newData } : n));
  }, [setNodes, debouncedPushUndo]);

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

  const handleNew = useCallback(() => {
    if (!window.confirm('Start a new project? Any unsaved changes will be lost.')) return;
    setNodes(structuredClone(blankNodes));
    setEdges(structuredClone(blankEdges));
    setSelectedNodeId(null);
    nextIdRef.current = getInitialNextId(blankNodes);
    setFilename('adventure');
    isDirtyRef.current = false;
    fileHandleRef.current = null;
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

  const flashSaved = useCallback(() => {
    clearTimeout(saveFlashTimerRef.current);
    setSaveFlash(true);
    saveFlashTimerRef.current = setTimeout(() => setSaveFlash(false), 2000);
    isDirtyRef.current = false;
  }, []);

  const handleSaveJSON = useCallback(async () => {
    const content = JSON.stringify({ nodes, edges }, null, 2);
    if (window.showSaveFilePicker) {
      try {
        // If the filename was changed since last save, start fresh with a new picker
        if (fileHandleRef.current) {
          const savedName = fileHandleRef.current.name.replace(/\.json$/i, '');
          if (savedName !== filename) fileHandleRef.current = null;
        }
        if (!fileHandleRef.current) {
          fileHandleRef.current = await window.showSaveFilePicker({
            suggestedName: `${filename}.json`,
            types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
          });
          setFilename(fileHandleRef.current.name.replace(/\.json$/i, ''));
        }
        const writable = await fileHandleRef.current.createWritable();
        await writable.write(content);
        await writable.close();
        flashSaved();
      } catch (e) {
        if (e.name !== 'AbortError') throw e;
      }
    } else {
      // Fallback for Firefox / Safari
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.json`;
      a.click();
      URL.revokeObjectURL(url);
      flashSaved();
    }
  }, [nodes, edges, filename, flashSaved]);

  const handleSaveAsJSON = useCallback(async () => {
    fileHandleRef.current = null;
    await handleSaveJSON();
  }, [handleSaveJSON]);

  useEffect(() => {
    const handler = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.key !== 's') return;
      e.preventDefault();
      if (e.shiftKey) { handleSaveAsJSON(); } else { handleSaveJSON(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleSaveJSON, handleSaveAsJSON]);

  const handleLoadWikitext = useCallback(({ nodes: newNodes, edges: newEdges }) => {
    setNodes(newNodes.map(n => n.id === '0' ? { ...n, deletable: false } : n));
    setEdges(newEdges);
    setSelectedNodeId(null);
    nextIdRef.current = getInitialNextId(newNodes);
    setImportWikitextOpen(false);
    isDirtyRef.current = false;
    fileHandleRef.current = null;
    clearHistory();
  }, [setNodes, setEdges, clearHistory]);

  const handleLoadJSON = useCallback((parsed, loadedFilename) => {
    if (!parsed.nodes || !parsed.edges) {
      alert('Invalid adventure JSON: missing nodes or edges.');
      return;
    }
    setNodes(parsed.nodes.map(n => n.id === '0' ? { ...n, deletable: false } : n));
    setEdges(parsed.edges);
    setSelectedNodeId(null);
    nextIdRef.current = getInitialNextId(parsed.nodes);
    if (loadedFilename) setFilename(loadedFilename);
    fileHandleRef.current = null;
    isDirtyRef.current = false;
    clearHistory();
  }, [setNodes, setEdges, clearHistory]);

  const displayedEdges = useMemo(() =>
    edges.map(e =>
      e.source === selectedNodeId
        ? { ...e, selected: true, style: { stroke: 'var(--accent-blue)', strokeWidth: 2 } }
        : e
    ),
    [edges, selectedNodeId]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <Toolbar
        onNew={handleNew}
        onAddNode={handleAddNode}
        onAutoLayout={handleAutoLayout}
        onExport={handleExport}
        onSaveJSON={handleSaveJSON}
        onSaveAsJSON={handleSaveAsJSON}
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
            edges={displayedEdges}
            elevateEdgesOnSelect
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            onNodesDelete={handleNodesDelete}
            onNodeDragStart={pushUndo}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onInit={(instance) => { reactFlowInstanceRef.current = instance; }}
            fitView
            deleteKeyCode="Delete"
            colorMode={theme}
          >
            <Background />
            <Controls />
            <MiniMap
              pannable
              style={{ bottom: 30 }}
              nodeColor={node => {
                if (node.data.numericId === 0) return 'gold';
                if (node.data.isEnding && node.data.isGoodEnding) return '#27ae60';
                if (node.data.isEnding) return '#c0392b';
                return '#555';
              }}
            />
            <Panel
              position="bottom-right"
              style={{ bottom: 8, right: 10, pointerEvents: 'none' }}
            >
              <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                {nodes.length} scene{nodes.length !== 1 ? 's' : ''}
              </span>
            </Panel>
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

      {saveFlash && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--accent-green-border)',
          color: 'var(--accent-green)',
          padding: '8px 18px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
          pointerEvents: 'none',
          zIndex: 9999,
        }}>
          ✓ Saved
        </div>
      )}
    </div>
  );
}
