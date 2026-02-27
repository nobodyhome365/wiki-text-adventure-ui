import { useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';

function getBorderColor(numericId, isEnding, isGoodEnding) {
  if (numericId === 0) return 'gold';
  if (isEnding && isGoodEnding) return '#27ae60';
  if (isEnding) return '#c0392b';
  return '#555';
}

export default function SceneNode({ id, data, selected }) {
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, data.choices.length, updateNodeInternals]);

  const { numericId, title, image, text, choices, isEnding, isGoodEnding, startOverText } = data;
  const borderColor = getBorderColor(numericId, isEnding, isGoodEnding);

  const truncatedText = text && text.length > 80 ? text.slice(0, 80) + '…' : text;

  return (
    <div
      style={{
        width: 220,
        border: `2px solid ${borderColor}`,
        borderRadius: 6,
        backgroundColor: selected ? '#2c2c2c' : '#1e1e1e',
        padding: '8px 10px',
        fontSize: 12,
        color: '#ddd',
        position: 'relative',
        boxShadow: selected ? `0 0 0 2px ${borderColor}44` : 'none',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="target"
        style={{ background: '#888', width: 10, height: 10 }}
      />

      <div style={{ fontWeight: 'bold', marginBottom: 4, color: borderColor, fontSize: 13 }}>
        #{numericId}{title ? ` — ${title}` : ''}
      </div>

      {image && (
        <div style={{ fontSize: 10, color: '#777', marginBottom: 4, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {image}
        </div>
      )}

      <div style={{ color: '#bbb', marginBottom: choices.length > 0 ? 6 : 0, lineHeight: 1.4, minHeight: 16 }}>
        {truncatedText || <span style={{ color: '#444' }}>(no text)</span>}
      </div>

      {choices.map((choice, idx) => (
        <div
          key={idx}
          style={{
            position: 'relative',
            borderTop: '1px solid #2e2e2e',
            padding: '5px 20px 5px 0',
            fontSize: 11,
            color: '#999',
          }}
        >
          <span style={{ color: '#646cff', marginRight: 4 }}>{idx + 1}.</span>
          {choice.text || <span style={{ color: '#444' }}>(no text)</span>}
          <Handle
            type="source"
            position={Position.Right}
            id={`choice-${idx}`}
            style={{
              right: -6,
              top: '50%',
              transform: 'translateY(-50%)',
              background: '#646cff',
              width: 10,
              height: 10,
              position: 'absolute',
            }}
          />
        </div>
      ))}

      {choices.length === 0 && !isEnding && (
        <div style={{ color: '#3a3a3a', fontSize: 10, marginTop: 4 }}>no choices</div>
      )}

      {isEnding && (
        <div
          style={{
            borderTop: '1px solid #2e2e2e',
            borderLeft: '2px solid #666',
            marginTop: choices.length > 0 ? 0 : 4,
            padding: '4px 6px',
            fontSize: 11,
            color: '#888',
            fontStyle: 'italic',
          }}
        >
          ↩ {startOverText || "START OVER"}
        </div>
      )}
    </div>
  );
}
