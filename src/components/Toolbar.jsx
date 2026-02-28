import { useState, useRef } from 'react';
import { Settings, Sun, Moon, Undo2, Redo2, ChevronDown, Save, SaveAll, FolderOpen, FilePlus, Upload, Download } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';

const menuStyle = {
  position: 'absolute',
  top: 'calc(100% + 6px)',
  left: 0,
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: 6,
  zIndex: 999,
  minWidth: 210,
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  overflow: 'hidden',
};

const menuItemBase = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  padding: '7px 12px',
  textAlign: 'left',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 12,
  color: 'var(--text-primary)',
  gap: 24,
  whiteSpace: 'nowrap',
  borderRadius: 0,
  transition: 'background-color 0.1s',
};

const menuDivider = { height: 1, backgroundColor: 'var(--border-subtle)', margin: '0' };

const kbdHint = { fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace' };

function MenuButton({ onClick, color, kbd, icon: Icon, children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...menuItemBase,
        color: color ?? 'var(--text-primary)',
        backgroundColor: hovered ? 'var(--bg-elevated)' : 'transparent',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {Icon && <Icon size={13} strokeWidth={2} />}
        {children}
      </span>
      {kbd && <span style={kbdHint}>{kbd}</span>}
    </button>
  );
}

export default function Toolbar({
  onNew, onAddNode, onAutoLayout,
  onExport, onImportWikitext,
  onSaveJSON, onSaveAsJSON, onLoadJSON,
  theme, onSetTheme,
  filename, onFilenameChange,
  canUndo, canRedo, onUndo, onRedo,
}) {
  const [fileOpen, setFileOpen] = useState(false);
  const [wikitextOpen, setWikitextOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const fileRef = useClickOutside(() => setFileOpen(false));
  const wikitextRef = useClickOutside(() => setWikitextOpen(false));
  const settingsRef = useClickOutside(() => setSettingsOpen(false));
  const fileInputRef = useRef(null);

  const toggleFile     = () => { setFileOpen(o => !o); setWikitextOpen(false); setSettingsOpen(false); };
  const toggleWikitext = () => { setWikitextOpen(o => !o); setFileOpen(false); setSettingsOpen(false); };
  const toggleSettings = () => { setSettingsOpen(o => !o); setFileOpen(false); setWikitextOpen(false); };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const loadedFilename = file.name.replace(/\.json$/i, '');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        onLoadJSON(JSON.parse(ev.target.result), loadedFilename);
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

      {/* File dropdown */}
      <div ref={fileRef} style={{ position: 'relative' }}>
        <button onClick={toggleFile} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          File <ChevronDown size={11} strokeWidth={2} />
        </button>
        {fileOpen && (
          <div style={menuStyle}>
            <MenuButton icon={FilePlus} color="#e74c3c" onClick={() => { onNew(); setFileOpen(false); }}>
              New Project
            </MenuButton>
            <div style={menuDivider} />
            <MenuButton icon={Save} kbd="Ctrl+S" onClick={() => { onSaveJSON(); setFileOpen(false); }}>
              Save
            </MenuButton>
            <MenuButton icon={SaveAll} kbd="Ctrl+Shift+S" onClick={() => { onSaveAsJSON(); setFileOpen(false); }}>
              Save As
            </MenuButton>
            <div style={menuDivider} />
            <MenuButton icon={FolderOpen} onClick={() => { fileInputRef.current?.click(); setFileOpen(false); }}>
              Load JSON
            </MenuButton>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} style={{ display: 'none' }} />
          </div>
        )}
      </div>

      {/* Wikitext dropdown */}
      <div ref={wikitextRef} style={{ position: 'relative' }}>
        <button onClick={toggleWikitext} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          Wikitext <ChevronDown size={11} strokeWidth={2} />
        </button>
        {wikitextOpen && (
          <div style={menuStyle}>
            <MenuButton icon={Upload} onClick={() => { onExport(); setWikitextOpen(false); }}>
              Export Wikitext
            </MenuButton>
            <MenuButton icon={Download} onClick={() => { onImportWikitext(); setWikitextOpen(false); }}>
              Import Wikitext
            </MenuButton>
          </div>
        )}
      </div>

      <div className="toolbar-divider" />

      <button onClick={onAddNode}>+ Add Scene</button>
      <button onClick={onAutoLayout}>Auto Layout</button>

      <div className="toolbar-divider" />

      <button onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Undo2 size={14} strokeWidth={2} /> Undo
      </button>
      <button onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Redo2 size={14} strokeWidth={2} /> Redo
      </button>

      {/* Push filename + settings to far right */}
      <div style={{ flex: 1 }} />

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

      {/* Settings gear */}
      <div ref={settingsRef} style={{ position: 'relative' }}>
        <button
          onClick={toggleSettings}
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
              minWidth: 180,
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

            <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '10px -12px', paddingTop: 10, paddingLeft: 12, paddingRight: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 6, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Shortcuts
              </div>
              {[
                ['Ctrl+Z',       'Undo'],
                ['Ctrl+Y',       'Redo'],
                ['Ctrl+S',       'Save'],
                ['Ctrl+Shift+S', 'Save As'],
                ['Del',          'Delete scene'],
                ['Esc',          'Deselect'],
              ].map(([key, label]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <kbd style={{
                    fontSize: 10,
                    padding: '1px 5px',
                    borderRadius: 3,
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-button)',
                    color: 'var(--text-muted)',
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap',
                  }}>{key}</kbd>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 10 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
