export const UNDO_STACK_MAX = 50;
export const UPDATE_DEBOUNCE_MS = 1500;
export const PANEL_WIDTH_MIN = 300;
export const PANEL_WIDTH_MAX = 700;
export const NODE_LAYOUT_WIDTH = 220;
export const NODE_LAYOUT_HEIGHT = 160;
export const COPY_FEEDBACK_MS = 2000;

export function getNodeColor(numericId, isEnding, isGoodEnding) {
  if (numericId === 0) return 'gold';
  if (isEnding && isGoodEnding) return '#27ae60';
  if (isEnding) return '#c0392b';
  return '#555';
}
