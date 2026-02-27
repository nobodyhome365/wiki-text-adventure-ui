import { createContext } from 'react';

export const NodeActionsContext = createContext({
  onDeleteNode: () => {},
  onDuplicateNode: () => {},
});
