import { useState, useEffect, useContext } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { NodeActionsContext } from '../contexts/NodeActionsContext';
import { useClickOutside } from '../hooks/useClickOutside';
import { NODE_LAYOUT_WIDTH, getNodeColor } from '../constants';

export default function SceneNode({ id, data, selected }) {
  const updateNodeInternals = useUpdateNodeInternals();
  const { onDeleteNode, onDuplicateNode } = useContext(NodeActionsContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useClickOutside(() => setMenuOpen(false));

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, data.choices.length, updateNodeInternals]);

  const { numericId, title, image, text, choices, isEnding, isGoodEnding, startOverText } = data;
  const borderColor = getNodeColor(numericId, isEnding, isGoodEnding);

  const truncatedText = text && text.length > 80 ? text.slice(0, 80) + '…' : text;

  return (
    <div
      style={{
        width: NODE_LAYOUT_WIDTH,
        border: `2px solid ${borderColor}`,
        borderRadius: 6,
        backgroundColor: selected ? 'var(--bg-elevated)' : 'var(--bg-secondary)',
        padding: '8px 10px',
        fontSize: 12,
        color: 'var(--text-primary)',
        position: 'relative',
        boxShadow: selected ? `0 0 0 2px ${borderColor}44` : 'none',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="target"
        style={{ background: 'var(--text-faint)', width: 10, height: 10 }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontWeight: 'bold', color: borderColor, fontSize: 13 }}>
          #{numericId}{title ? ` — ${title}` : ''}
        </span>

        {numericId !== 0 && (
          <div ref={menuRef} style={{ position: 'relative' }} className="nodrag nopan">
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-faint)',
                padding: '0 2px',
                fontSize: 14,
                lineHeight: 1,
                borderRadius: 3,
              }}
              title="Node actions"
            >
              ⋮
            </button>
            {menuOpen && (
              <div className="menu-dropdown" style={{ top: 'calc(100% + 2px)', right: 0, left: 'auto', minWidth: 120 }}>
                <button
                  className="menu-item"
                  onClick={e => { e.stopPropagation(); onDuplicateNode(id); setMenuOpen(false); }}
                >
                  Duplicate
                </button>
                <button
                  className="menu-item"
                  onClick={e => { e.stopPropagation(); onDeleteNode(id); setMenuOpen(false); }}
                  style={{ color: '#e74c3c' }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {image && (
        <div style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 4, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {image}
        </div>
      )}

      <div style={{ color: 'var(--text-muted)', marginBottom: choices.length > 0 ? 6 : 0, lineHeight: 1.4, minHeight: 16 }}>
        {truncatedText || <span style={{ color: 'var(--text-disabled)' }}>(no text)</span>}
      </div>

      {choices.map((choice, idx) => (
        <div
          key={idx}
          style={{
            position: 'relative',
            borderTop: '1px solid var(--node-divider)',
            padding: '5px 20px 5px 0',
            fontSize: 11,
            color: 'var(--text-muted)',
          }}
        >
          <span style={{ color: 'var(--accent-blue)', marginRight: 4 }}>{idx + 1}.</span>
          {choice.text || <span style={{ color: 'var(--text-disabled)' }}>(no text)</span>}
          <Handle
            type="source"
            position={Position.Right}
            id={`choice-${idx}`}
            style={{
              right: -6,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'var(--accent-blue)',
              width: 10,
              height: 10,
              position: 'absolute',
            }}
          />
        </div>
      ))}

      {choices.length === 0 && !isEnding && (
        <div style={{ color: 'var(--text-disabled)', fontSize: 10, marginTop: 4 }}>no choices</div>
      )}

      {isEnding && (
        <div
          style={{
            borderTop: '1px solid var(--node-divider)',
            borderLeft: '2px solid var(--text-faint)',
            marginTop: choices.length > 0 ? 0 : 4,
            padding: '4px 6px',
            fontSize: 11,
            color: 'var(--text-faint)',
            fontStyle: 'italic',
          }}
        >
          ↩ {startOverText || "START OVER"}
        </div>
      )}
    </div>
  );
}
