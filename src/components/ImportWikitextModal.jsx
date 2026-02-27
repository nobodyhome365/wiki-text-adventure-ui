import { useState } from 'react';
import { importWikitext } from '../utils/wikitextImporter';

export default function ImportWikitextModal({ onImport, onClose }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleImport = () => {
    setError('');
    try {
      const result = importWikitext(text);
      onImport(result);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="scene-modal-overlay" onClick={onClose}>
      <div className="code-modal" onClick={e => e.stopPropagation()}>
        <div className="scene-modal-header">
          <span style={{ fontWeight: 'bold', fontSize: 15 }}>Import Wikitext</span>
          <button className="btn-sm" onClick={onClose}>✕ Close</button>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
          Paste a text adventure <code style={{ color: 'var(--text-muted)' }}>{'{{#switch:{{Get}}...}}'}</code> block below.
        </div>

        <textarea
          value={text}
          onChange={e => { setText(e.target.value); setError(''); }}
          placeholder={'{{#switch:{{Get}}\n|0 =\n{{Text adventure\n|text = \nYour scene here...\n}}\n}}'}
          className="code-modal-textarea"
        />

        {error && (
          <div style={{ fontSize: 12, color: '#c0392b', padding: '6px 10px', backgroundColor: '#1e1010', border: '1px solid #5a2020', borderRadius: 4 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={handleImport}
            disabled={!text.trim()}
            style={{ borderColor: 'var(--accent-green-border)', color: 'var(--accent-green)' }}
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
