export default function CodeModal({ title, onClose, children }) {
  return (
    <div className="scene-modal-overlay" onClick={onClose}>
      <div className="code-modal" onClick={e => e.stopPropagation()}>
        <div className="scene-modal-header">
          <span style={{ fontWeight: 'bold', fontSize: 15 }}>{title}</span>
          <button className="btn-sm" onClick={onClose}>✕ Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}
