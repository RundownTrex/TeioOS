import { useContext } from 'react';
import { ShortcutContext } from '../context/ShortcutContext';

export const useShortcuts = () => {
  const context = useContext(ShortcutContext);
  if (!context) {
    throw new Error('useShortcuts must be used within a ShortcutProvider');
  }
  return context;
};

export default useShortcuts;
