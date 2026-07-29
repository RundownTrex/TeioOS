import { useContext } from 'react';
import { TTSContext } from '../context/TTSContext';

export const useTTS = () => {
  const context = useContext(TTSContext);
  if (!context) {
    throw new Error('useTTS must be used within a TTSProvider');
  }
  return context;
};

export default useTTS;
