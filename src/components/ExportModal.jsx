import { useRef, useState } from 'react';

export default function ExportModal({ wikitext, onClose }) {
  const textareaRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(wikitext).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
          <span style={{ fontWeight: 'bold', fontSize: 15 }}>Exported Wikitext</span>
          <button onClick={onClose} style={{ padding: '2px 8px' }}>✕ Close</button>
        </div>

        <textarea
          ref={textareaRef}
          value={wikitext}
          readOnly
          style={{
            fontFamily: 'monospace',
            fontSize: 12,
            flex: 1,
            resize: 'vertical',
            minHeight: 300,
            lineHeight: 1.5,
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleCopy}
            style={copied ? { borderColor: '#27ae60', color: '#27ae60' } : {}}
          >
            {copied ? '✓ Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
