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
    isDirtyRef.current = true;
    setEdges(eds => {
      const filtered = eds.filter(
        e => !(e.source === connection.source && e.sourceHandle === connection.sourceHandle)
      );
      return addEdge(connection, filtered);
    });
  }, [setEdges]);

  const handleAddNode = useCallback(() => {
    isDirtyRef.current = true;
    const newId = String(nextIdRef.current++);
    setNodes(nds => [...nds, {
      id: newId,
      type: 'sceneNode',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
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
  }, [setNodes]);

  const handleUpdateNode = useCallback((nodeId, newData) => {
    isDirtyRef.current = true;
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: newData } : n));
  }, [setNodes]);

  const handleAddChoice = useCallback((nodeId) => {
    isDirtyRef.current = true;
    setNodes(nds => nds.map(n => {
      if (n.id !== nodeId) return n;
      return { ...n, data: { ...n.data, choices: [...n.data.choices, { text: '' }] } };
    }));
  }, [setNodes]);

  const handleDeleteChoice = useCallback((nodeId, choiceIndex) => {
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
  }, [setEdges, setNodes]);

  const handleNodesDelete = useCallback((deletedNodes) => {
    isDirtyRef.current = true;
    const deletedIds = new Set(deletedNodes.map(n => n.id));
    setEdges(eds => eds.filter(e => !deletedIds.has(e.source) && !deletedIds.has(e.target)));
    if (deletedIds.has(selectedNodeId)) {
      setSelectedNodeId(null);
    }
  }, [setEdges, selectedNodeId]);

  const handleDeleteNode = useCallback((nodeId) => {
    if (nodeId === '0') return;
    isDirtyRef.current = true;
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNodeId(null);
  }, [setNodes, setEdges]);

  const handleNew = useCallback(() => {
    if (!window.confirm('Start a new project? Any unsaved changes will be lost.')) return;
    setNodes(structuredClone(blankNodes));
    setEdges(structuredClone(blankEdges));
    setSelectedNodeId(null);
    nextIdRef.current = getInitialNextId(blankNodes);
    setFilename('adventure');
    isDirtyRef.current = false;
  }, [setNodes, setEdges]);

  const handleAutoLayout = useCallback(() => {
    isDirtyRef.current = true;
    setNodes(nds => runAutoLayout(nds, edges));
  }, [edges, setNodes]);

  const handleExport = useCallback(() => {
    setWikitextContent(exportWikitext(nodes, edges));
    setExportModalOpen(true);
  }, [nodes, edges]);

  const handleSaveJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify({ nodes, edges }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
    isDirtyRef.current = false;
  }, [nodes, edges, filename]);

  const handleLoadWikitext = useCallback(({ nodes: newNodes, edges: newEdges }) => {
    setNodes(newNodes);
    setEdges(newEdges);
    setSelectedNodeId(null);
    nextIdRef.current = getInitialNextId(newNodes);
    setImportWikitextOpen(false);
    isDirtyRef.current = false;
  }, [setNodes, setEdges]);

  const handleLoadJSON = useCallback((parsed, loadedFilename) => {
    if (!parsed.nodes || !parsed.edges) {
      alert('Invalid adventure JSON: missing nodes or edges.');
      return;
    }
    setNodes(parsed.nodes);
    setEdges(parsed.edges);
    setSelectedNodeId(null);
    nextIdRef.current = getInitialNextId(parsed.nodes);
    if (loadedFilename) setFilename(loadedFilename);
    isDirtyRef.current = false;
  }, [setNodes, setEdges]);

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
      />

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
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode="Delete"
            colorMode={theme}
          >
            <Background />
            <Controls />
            <MiniMap
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
            onClose={() => setSelectedNodeId(null)}
            panelWidth={panelWidth}
            onPanelResize={setPanelWidth}
          />
        )}
      </div>

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
