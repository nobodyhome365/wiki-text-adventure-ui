import { useCallback, useState, useRef } from 'react';
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
import { defaultNodes, defaultEdges, getInitialNextId } from './utils/defaultData';
import { exportWikitext } from './utils/wikitextExporter';
import { runAutoLayout } from './utils/autoLayout';

// Must be defined outside the component to avoid re-creating on every render
const nodeTypes = { sceneNode: SceneNode };

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [panelWidth, setPanelWidth] = useState(300);
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

  const handleConnect = useCallback((connection) => {
    if (connection.source === connection.target) return;
    setEdges(eds => {
      const filtered = eds.filter(
        e => !(e.source === connection.source && e.sourceHandle === connection.sourceHandle)
      );
      return addEdge(connection, filtered);
    });
  }, [setEdges]);

  const handleAddNode = useCallback(() => {
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
      },
    }]);
  }, [setNodes]);

  const handleUpdateNode = useCallback((nodeId, newData) => {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: newData } : n));
  }, [setNodes]);

  const handleAddChoice = useCallback((nodeId) => {
    setNodes(nds => nds.map(n => {
      if (n.id !== nodeId) return n;
      return { ...n, data: { ...n.data, choices: [...n.data.choices, { text: '' }] } };
    }));
  }, [setNodes]);

  const handleDeleteChoice = useCallback((nodeId, choiceIndex) => {
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
    const deletedIds = new Set(deletedNodes.map(n => n.id));
    setEdges(eds => eds.filter(e => !deletedIds.has(e.source) && !deletedIds.has(e.target)));
    if (deletedIds.has(selectedNodeId)) {
      setSelectedNodeId(null);
    }
  }, [setEdges, selectedNodeId]);

  const handleDeleteNode = useCallback((nodeId) => {
    if (nodeId === '0') return;
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNodeId(null);
  }, [setNodes, setEdges]);

  const handleAutoLayout = useCallback(() => {
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
    a.download = 'adventure.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const handleLoadWikitext = useCallback(({ nodes: newNodes, edges: newEdges }) => {
    setNodes(newNodes);
    setEdges(newEdges);
    setSelectedNodeId(null);
    nextIdRef.current = getInitialNextId(newNodes);
    setImportWikitextOpen(false);
  }, [setNodes, setEdges]);

  const handleLoadJSON = useCallback((parsed) => {
    if (!parsed.nodes || !parsed.edges) {
      alert('Invalid adventure JSON: missing nodes or edges.');
      return;
    }
    setNodes(parsed.nodes);
    setEdges(parsed.edges);
    setSelectedNodeId(null);
    nextIdRef.current = getInitialNextId(parsed.nodes);
  }, [setNodes, setEdges]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <Toolbar
        onAddNode={handleAddNode}
        onAutoLayout={handleAutoLayout}
        onExport={handleExport}
        onSaveJSON={handleSaveJSON}
        onLoadJSON={handleLoadJSON}
        onImportWikitext={() => setImportWikitextOpen(true)}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            onNodesDelete={handleNodesDelete}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode="Delete"
            colorMode="dark"
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
