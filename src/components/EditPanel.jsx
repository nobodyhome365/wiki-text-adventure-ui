import { useState } from 'react';
import { PANEL_WIDTH_MIN, PANEL_WIDTH_MAX } from '../constants';

export default function EditPanel({
  selectedNode,
  onUpdateNode,
  onDeleteChoice,
  onAddChoice,
  onDeleteNode,
  onDuplicateNode,
  onClose,
  panelWidth,
  onPanelResize,
}) {
  const [sceneModalOpen, setSceneModalOpen] = useState(false);
  const [draftText, setDraftText] = useState('');

  if (!selectedNode) return null;

  const { id, data } = selectedNode;
  const { numericId, image, title, imagesize, text, choices, isEnding, isGoodEnding, startOverText } = data;

  const patch = (field, value) => {
    onUpdateNode(id, { ...data, [field]: value });
  };

  const patchChoice = (idx, value) => {
    const newChoices = choices.map((c, i) => i === idx ? { ...c, text: value } : c);
    patch('choices', newChoices);
  };

  const handleResizeMouseDown = (e) => {
    const startX = e.clientX;
    const startWidth = panelWidth;
    const onMove = (mv) => {
      const delta = startX - mv.clientX;
      onPanelResize(Math.min(PANEL_WIDTH_MAX, Math.max(PANEL_WIDTH_MIN, startWidth + delta)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div
      style={{
        width: panelWidth,
        height: '100%',
        backgroundColor: 'var(--bg-primary)',
        borderLeft: '1px solid var(--border-color)',
        padding: '12px 14px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        position: 'relative',
      }}
    >
      {/* Drag handle */}
      <div className="resize-handle" onMouseDown={handleResizeMouseDown} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontWeight: 'bold', fontSize: 14 }}>Scene #{numericId}</span>
        <button className="btn-sm" onClick={onClose}>✕</button>
      </div>
      {numericId !== 0 && (
        <div style={{ marginBottom: 12, display: 'flex', gap: 6 }}>
          <button
            className="btn-sm"
            onClick={() => onDuplicateNode(id)}
            style={{ flex: 1 }}
          >
            Duplicate
          </button>
          <button
            className="btn-sm btn-danger"
            onClick={() => onDeleteNode(id)}
            style={{ flex: 1 }}
          >
            Delete Scene
          </button>
        </div>
      )}

      <label>Title</label>
      <input
        className="nodrag nopan"
        value={title}
        onChange={e => patch('title', e.target.value)}
        placeholder="e.g. You Have Died"
      />

      <label>Image filename</label>
      <input
        className="nodrag nopan"
        value={image}
        onChange={e => patch('image', e.target.value)}
        placeholder="e.g. Example.jpg"
      />

      <label>Image size</label>
      <input
        className="nodrag nopan"
        value={imagesize}
        onChange={e => patch('imagesize', e.target.value)}
        placeholder="e.g. 300px"
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 3 }}>
        <label style={{ margin: 0 }}>Scene text</label>
        <button
          className="btn-sm"
          title="Edit in fullscreen"
          onClick={() => { setDraftText(text || ''); setSceneModalOpen(true); }}
        >
          ↗
        </button>
      </div>
      <textarea
        className="nodrag nopan"
        value={text}
        onChange={e => patch('text', e.target.value)}
        rows={7}
        style={{ resize: 'vertical' }}
        placeholder="Describe this scene..."
      />

      <div className="checkbox-row" style={{ marginTop: 14 }}>
        <input
          type="checkbox"
          id="isEnding"
          className="nodrag nopan"
          checked={!!isEnding}
          onChange={e => {
            const val = e.target.checked;
            const updates = { isEnding: val };
            if (val && !startOverText) updates.startOverText = isGoodEnding ? "'''PLAY AGAIN?'''" : "'''START OVER'''";
            if (val && !title) updates.title = 'Game Over!';
            if (!val && (title === 'Game Over!' || title === 'You Have Won!')) updates.title = '';
            onUpdateNode(id, { ...data, ...updates });
          }}
        />
        <label htmlFor="isEnding" className="checkbox-label">
          Ending node
        </label>
      </div>

      {isEnding && (
        <>
          <div className="checkbox-row" style={{ marginTop: 8 }}>
            <input
              type="checkbox"
              id="isGoodEnding"
              className="nodrag nopan"
              checked={!!isGoodEnding}
              onChange={e => {
                const val = e.target.checked;
                let newStartOverText = startOverText;
                if (val && (!startOverText || startOverText === "'''START OVER'''")) {
                  newStartOverText = "'''PLAY AGAIN?'''";
                } else if (!val && startOverText === "'''PLAY AGAIN?'''") {
                  newStartOverText = "'''START OVER'''";
                }
                let newTitle = title;
                if (val && (!title || title === 'Game Over!')) {
                  newTitle = 'You Have Won!';
                } else if (!val && title === 'You Have Won!') {
                  newTitle = 'Game Over!';
                }
                onUpdateNode(id, { ...data, isGoodEnding: val, startOverText: newStartOverText, title: newTitle });
              }}
            />
            <label htmlFor="isGoodEnding" className="checkbox-label">
              Good ending
            </label>
          </div>
          <label>Start over button text</label>
          <input
            className="nodrag nopan"
            value={startOverText || ''}
            onChange={e => patch('startOverText', e.target.value)}
            placeholder="'''START OVER'''"
          />
        </>
      )}

      <div style={{ marginTop: 14, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 'bold' }}>Choices</span>
        <button className="btn-sm" onClick={() => onAddChoice(id)}>
          + Add Choice
        </button>
      </div>

      {choices.length === 0 && (
        <div style={{ fontSize: 11, color: 'var(--text-disabled)', marginBottom: 8 }}>
          No choices — this is a leaf node. Add a choice and drag its handle to connect it to another scene.
        </div>
      )}

      {choices.map((choice, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{ color: 'var(--accent-blue)', fontSize: 11, minWidth: 16 }}>{idx + 1}.</span>
          <input
            className="nodrag nopan"
            value={choice.text}
            onChange={e => patchChoice(idx, e.target.value)}
            placeholder="Choice text..."
            style={{ flex: 1 }}
          />
          <button
            className="btn-sm btn-danger"
            onClick={() => onDeleteChoice(id, idx)}
            style={{ flexShrink: 0 }}
          >
            ✕
          </button>
        </div>
      ))}

      {isEnding && (
        <div
          style={{
            marginTop: 6,
            padding: '5px 8px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderLeft: '2px solid var(--text-faint)',
            borderRadius: 4,
            fontSize: 11,
            color: 'var(--text-faint)',
            fontStyle: 'italic',
          }}
        >
          (implicit) ↩ {startOverText || "START OVER"} → #0
        </div>
      )}

      <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-disabled)', lineHeight: 1.5 }}>
        Drag a choice handle (right side of node) to another node to connect it.
      </div>

      {/* Fullscreen scene text modal */}
      {sceneModalOpen && (
        <div className="scene-modal-overlay">
          <div className="scene-modal">
            <div className="scene-modal-header">
              <span style={{ fontWeight: 'bold', fontSize: 14 }}>
                Scene Text — {title || `#${numericId}`}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { patch('text', draftText); setSceneModalOpen(false); }}
                  style={{ borderColor: '#27ae60', color: '#27ae60' }}
                >
                  Save
                </button>
                <button onClick={() => setSceneModalOpen(false)}>Cancel</button>
              </div>
            </div>
            <textarea
              className="scene-modal-textarea nodrag nopan"
              value={draftText}
              onChange={e => setDraftText(e.target.value)}
              placeholder="Write your scene text..."
              autoFocus
            />
          </div>
        </div>
      )}
    </div>
  );
}
