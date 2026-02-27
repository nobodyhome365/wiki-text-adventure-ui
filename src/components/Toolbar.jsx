import { Save, FolderOpen } from 'lucide-react';

export default function Toolbar({ onAddNode, onAutoLayout, onExport, onSaveJSON, onLoadJSON, onImportWikitext }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        onLoadJSON(parsed);
      } catch {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      style={{
        height: 48,
        backgroundColor: '#111',
        borderBottom: '1px solid #2e2e2e',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 14px',
        flexShrink: 0,
      }}
    >
      <span style={{ fontWeight: 'bold', fontSize: 14, marginRight: 8, color: '#aaa', letterSpacing: '0.02em' }}>
        Text Adventure Editor
      </span>

      <div style={{ width: 1, height: 24, backgroundColor: '#2e2e2e', margin: '0 4px' }} />

      <button onClick={onAddNode}>+ Add Node</button>
      <button onClick={onAutoLayout}>Auto Layout</button>

      <div style={{ width: 1, height: 24, backgroundColor: '#2e2e2e', margin: '0 4px' }} />

      <button onClick={onExport} style={{ borderColor: '#2a5a2a', color: '#5a9' }}>
        Export Wikitext
      </button>
      <button onClick={onImportWikitext} style={{ borderColor: '#2a5a2a', color: '#5a9' }}>
        Import Wikitext
      </button>
      <button onClick={onSaveJSON}><Save size={14} strokeWidth={2} /> Save JSON</button>

      <label
        className="btn"
        style={{
          cursor: 'pointer',
          borderRadius: 6,
          border: '1px solid #444',
          padding: '0.4em 0.9em',
          fontSize: '0.85em',
          fontWeight: 500,
          backgroundColor: '#2a2a2a',
          color: 'rgba(255,255,255,0.87)',
          transition: 'border-color 0.2s, background-color 0.2s',
          userSelect: 'none',
        }}
      >
        <FolderOpen size={14} strokeWidth={2} /> Load JSON
        <input type="file" accept=".json" onChange={handleFileChange} style={{ display: 'none' }} />
      </label>
    </div>
  );
}
