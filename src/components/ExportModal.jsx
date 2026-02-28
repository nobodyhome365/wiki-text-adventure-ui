import { useState } from 'react';
import CodeModal from './CodeModal';
import { COPY_FEEDBACK_MS } from '../constants';

export default function ExportModal({ wikitext, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(wikitext).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    });
  };

  return (
    <CodeModal title="Exported Wikitext" onClose={onClose}>
      <textarea value={wikitext} readOnly className="code-modal-textarea" />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleCopy}
          style={copied ? { borderColor: '#27ae60', color: '#27ae60' } : {}}
        >
          {copied ? '✓ Copied!' : 'Copy to Clipboard'}
        </button>
      </div>
    </CodeModal>
  );
}
