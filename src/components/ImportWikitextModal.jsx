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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#161616',
          border: '1px solid #333',
          borderRadius: 8,
          padding: 24,
          width: '70vw',
          maxWidth: 900,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', fontSize: 15 }}>Import Wikitext</span>
          <button onClick={onClose} style={{ padding: '2px 8px' }}>✕ Close</button>
        </div>

        <div style={{ fontSize: 12, color: '#777' }}>
          Paste a text adventure <code style={{ color: '#aaa' }}>{'{{#switch:{{Get}}...}}'}</code> block below.
        </div>

        <textarea
          value={text}
          onChange={e => { setText(e.target.value); setError(''); }}
          placeholder={'{{#switch:{{Get}}\n|0 =\n{{Text adventure\n|text = \nYour scene here...\n}}\n}}'}
          style={{
            fontFamily: 'monospace',
            fontSize: 12,
            flex: 1,
            resize: 'vertical',
            minHeight: 300,
            lineHeight: 1.5,
          }}
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
            style={{ borderColor: '#2a5a2a', color: '#5a9' }}
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}