export default function EditPanel({
  selectedNode,
  onUpdateNode,
  onDeleteChoice,
  onAddChoice,
  onDeleteNode,
  onClose,
}) {
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

  return (
    <div
      style={{
        width: 300,
        height: '100%',
        backgroundColor: '#161616',
        borderLeft: '1px solid #2e2e2e',
        padding: '12px 14px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontWeight: 'bold', fontSize: 14 }}>Scene #{numericId}</span>
        <button onClick={onClose} style={{ padding: '2px 8px', fontSize: 12 }}>✕</button>
      </div>
      {numericId !== 0 && (
        <div style={{ marginBottom: 12 }}>
          <button
            onClick={() => onDeleteNode(id)}
            style={{ fontSize: 11, padding: '2px 8px', color: '#c0392b', borderColor: '#5a2020', width: '100%' }}
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
        placeholder="e.g. Bench snow meri.jpg"
      />

      <label>Image size</label>
      <input
        className="nodrag nopan"
        value={imagesize}
        onChange={e => patch('imagesize', e.target.value)}
        placeholder="e.g. 300px"
      />

      <label>Scene text</label>
      <textarea
        className="nodrag nopan"
        value={text}
        onChange={e => patch('text', e.target.value)}
        rows={7}
        style={{ resize: 'vertical' }}
        placeholder="Describe this scene..."
      />

      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          id="isEnding"
          className="nodrag nopan"
          checked={!!isEnding}
          onChange={e => patch('isEnding', e.target.checked)}
          style={{ width: 'auto', cursor: 'pointer' }}
        />
        <label htmlFor="isEnding" style={{ margin: 0, cursor: 'pointer', color: '#aaa', fontSize: '0.85em' }}>
          Ending node
        </label>
      </div>

      {isEnding && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <input
              type="checkbox"
              id="isGoodEnding"
              className="nodrag nopan"
              checked={!!isGoodEnding}
              onChange={e => patch('isGoodEnding', e.target.checked)}
              style={{ width: 'auto', cursor: 'pointer' }}
            />
            <label htmlFor="isGoodEnding" style={{ margin: 0, cursor: 'pointer', color: '#aaa', fontSize: '0.85em' }}>
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
        <button onClick={() => onAddChoice(id)} style={{ fontSize: 11, padding: '2px 8px' }}>
          + Add Choice
        </button>
      </div>

      {choices.length === 0 && (
        <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>
          No choices — this is a leaf node. Add a choice and drag its handle to connect it to another scene.
        </div>
      )}

      {choices.map((choice, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{ color: '#646cff', fontSize: 11, minWidth: 16 }}>{idx + 1}.</span>
          <input
            className="nodrag nopan"
            value={choice.text}
            onChange={e => patchChoice(idx, e.target.value)}
            placeholder="Choice text..."
            style={{ flex: 1 }}
          />
          <button
            onClick={() => onDeleteChoice(id, idx)}
            style={{ padding: '2px 6px', fontSize: 12, flexShrink: 0, borderColor: '#5a2020', color: '#c0392b' }}
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
            backgroundColor: '#1e1e1e',
            border: '1px solid #2e2e2e',
            borderLeft: '2px solid #666',
            borderRadius: 4,
            fontSize: 11,
            color: '#777',
            fontStyle: 'italic',
          }}
        >
          (implicit) ↩ {startOverText || "START OVER"} → #0
        </div>
      )}

      <div style={{ marginTop: 8, fontSize: 10, color: '#555', lineHeight: 1.5 }}>
        Drag a choice handle (right side of node) to another node to connect it.
      </div>
    </div>
  );
}
