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
    <div className="scene-modal-overlay" onClick={onClose}>
      <div className="code-modal" onClick={e => e.stopPropagation()}>
        <div className="scene-modal-header">
          <span style={{ fontWeight: 'bold', fontSize: 15 }}>Exported Wikitext</span>
          <button className="btn-sm" onClick={onClose}>✕ Close</button>
        </div>

        <textarea
          ref={textareaRef}
          value={wikitext}
          readOnly
          className="code-modal-textarea"
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
