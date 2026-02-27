import { useState, useEffect, useRef } from 'react';
import { Save, FolderOpen, Settings, Sun, Moon } from 'lucide-react';

export default function Toolbar({ onNew, onAddNode, onAutoLayout, onExport, onSaveJSON, onLoadJSON, onImportWikitext, theme, onSetTheme, filename, onFilenameChange }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    if (!settingsOpen) return;
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [settingsOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const loadedFilename = file.name.replace(/\.json$/i, '');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        onLoadJSON(parsed, loadedFilename);
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
        backgroundColor: 'var(--bg-canvas)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 14px',
        flexShrink: 0,
      }}
    >
      <span style={{ fontWeight: 'bold', fontSize: 14, marginRight: 8, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
        Text Adventure Editor
      </span>

      <div className="toolbar-divider" />

      <button onClick={onNew}>New</button>
      <button onClick={onAddNode}>+ Add Node</button>
      <button onClick={onAutoLayout}>Auto Layout</button>

      <div className="toolbar-divider" />

      <button onClick={onExport} style={{ borderColor: 'var(--accent-green-border)', color: 'var(--accent-green)' }}>
        Export Wikitext
      </button>
      <button onClick={onImportWikitext} style={{ borderColor: 'var(--accent-green-border)', color: 'var(--accent-green)' }}>
        Import Wikitext
      </button>
      <input
        type="text"
        value={filename}
        onChange={e => onFilenameChange(e.target.value)}
        spellCheck={false}
        style={{
          width: 130,
          fontSize: '0.85em',
          padding: '0.35em 0.6em',
          borderRadius: 6,
          border: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-button)',
          color: 'var(--text-primary)',
          outline: 'none',
        }}
        placeholder="adventure"
      />
      <span style={{ fontSize: '0.8em', color: 'var(--text-muted)', marginLeft: -4 }}>.json</span>
      <button className="btn" onClick={onSaveJSON}><Save size={14} strokeWidth={2} /> Save JSON</button>

      <label
        className="btn"
        style={{
          cursor: 'pointer',
          borderRadius: 6,
          border: '1px solid var(--border-subtle)',
          padding: '0.4em 0.9em',
          fontSize: '0.85em',
          fontWeight: 500,
          backgroundColor: 'var(--bg-button)',
          color: 'var(--text-primary)',
          transition: 'border-color 0.2s, background-color 0.2s',
          userSelect: 'none',
        }}
      >
        <FolderOpen size={14} strokeWidth={2} /> Load JSON
        <input type="file" accept=".json" onChange={handleFileChange} style={{ display: 'none' }} />
      </label>

      {/* Push settings to far right */}
      <div style={{ flex: 1 }} />

      {/* Settings gear */}
      <div ref={settingsRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setSettingsOpen(o => !o)}
          title="Settings"
          style={{ padding: '4px 8px', display: 'flex', alignItems: 'center' }}
        >
          <Settings size={14} strokeWidth={2} />
        </button>

        {settingsOpen && (
          <div
            className="nodrag nopan"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              padding: '10px 12px',
              zIndex: 999,
              minWidth: 160,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Appearance
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => onSetTheme('dark')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  fontSize: 12,
                  backgroundColor: theme === 'dark' ? 'var(--accent-blue)' : 'var(--bg-button)',
                  color: theme === 'dark' ? '#fff' : 'var(--text-primary)',
                  borderColor: theme === 'dark' ? 'var(--accent-blue)' : 'var(--border-subtle)',
                }}
              >
                <Moon size={12} /> Dark
              </button>
              <button
                onClick={() => onSetTheme('light')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  fontSize: 12,
                  backgroundColor: theme === 'light' ? 'var(--accent-blue)' : 'var(--bg-button)',
                  color: theme === 'light' ? '#fff' : 'var(--text-primary)',
                  borderColor: theme === 'light' ? 'var(--accent-blue)' : 'var(--border-subtle)',
                }}
              >
                <Sun size={12} /> Light
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
