import { useState, useRef } from 'react';
import { Settings, Sun, Moon, Undo2, Redo2, ChevronDown, Save, SaveAll, FolderOpen, FilePlus, Upload, Download, Pencil } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';

const kbdHint = { fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace' };

function MenuButton({ onClick, color, kbd, icon: Icon, children }) {
  return (
    <button
      className="menu-item"
      onClick={onClick}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 24,
        whiteSpace: 'nowrap',
        color: color ?? undefined,
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

  const [filenameEditing, setFilenameEditing] = useState(false);

  const fileRef = useClickOutside(() => setFileOpen(false));
  const wikitextRef = useClickOutside(() => setWikitextOpen(false));
  const settingsRef = useClickOutside(() => setSettingsOpen(false));
  const fileInputRef = useRef(null);
  const filenameInputRef = useRef(null);

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
          <div className="menu-dropdown">
            <MenuButton icon={FilePlus} color="#e74c3c" onClick={() => { onNew(); setFileOpen(false); }}>
              New Project
            </MenuButton>
            <div className="menu-divider" />
            <MenuButton icon={Save} kbd="Ctrl+S" onClick={() => { onSaveJSON(); setFileOpen(false); }}>
              Save
            </MenuButton>
            <MenuButton icon={SaveAll} onClick={() => { onSaveAsJSON(); setFileOpen(false); }}>
              Save As
            </MenuButton>
            <div className="menu-divider" />
            <MenuButton icon={FolderOpen} onClick={() => { fileInputRef.current?.click(); setFileOpen(false); }}>
              Load JSON
            </MenuButton>
          </div>
        )}
      </div>

      {/* Wikitext dropdown */}
      <div ref={wikitextRef} style={{ position: 'relative' }}>
        <button onClick={toggleWikitext} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          Wikitext <ChevronDown size={11} strokeWidth={2} />
        </button>
        {wikitextOpen && (
          <div className="menu-dropdown">
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

      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} style={{ display: 'none' }} />

      {/* Push filename + settings to far right */}
      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <button
          onClick={() => { setFilenameEditing(true); setTimeout(() => filenameInputRef.current?.select(), 0); }}
          title="Rename file"
          style={{ padding: '2px 4px', display: 'flex', alignItems: 'center', border: 'none', background: 'none', color: 'var(--text-faint)' }}
        >
          <Pencil size={11} strokeWidth={2} />
        </button>
        {filenameEditing ? (
          <input
            ref={filenameInputRef}
            type="text"
            value={filename}
            onChange={e => onFilenameChange(e.target.value)}
            onBlur={() => setFilenameEditing(false)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setFilenameEditing(false); }}
            spellCheck={false}
            style={{ width: 110, fontSize: '0.85em', padding: '0.2em 0.4em' }}
            placeholder="adventure"
          />
        ) : (
          <span
            style={{ fontSize: '0.85em', color: 'var(--text-primary)', cursor: 'default' }}
            onDoubleClick={() => { setFilenameEditing(true); setTimeout(() => filenameInputRef.current?.select(), 0); }}
          >
            {filename || 'adventure'}
          </span>
        )}
        <span style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>.json</span>
      </div>

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
            className="menu-dropdown nodrag nopan"
            style={{ right: 0, left: 'auto', minWidth: 180, padding: '10px 12px' }}
          >
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Appearance
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[['dark', Moon, 'Dark'], ['light', Sun, 'Light']].map(([value, Icon, label]) => {
                const active = theme === value;
                return (
                  <button
                    key={value}
                    onClick={() => onSetTheme(value)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      fontSize: 12,
                      backgroundColor: active ? 'var(--accent-blue)' : 'var(--bg-button)',
                      color: active ? '#fff' : 'var(--text-primary)',
                      borderColor: active ? 'var(--accent-blue)' : 'var(--border-subtle)',
                    }}
                  >
                    <Icon size={12} /> {label}
                  </button>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '10px -12px', paddingTop: 10, paddingLeft: 12, paddingRight: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 6, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Shortcuts
              </div>
              {[
                ['Ctrl+Z', 'Undo'],
                ['Ctrl+Y', 'Redo'],
                ['Ctrl+S', 'Save'],
                ['Del',    'Delete scene'],
                ['Esc',    'Deselect'],
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
