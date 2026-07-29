import { useContext } from 'react';
import { STTContext } from '../context/STTContext';

export const useSTT = () => {
  const context = useContext(STTContext);
  if (!context) {
    throw new Error('useSTT must be used within an STTProvider');
  }
  return context;
};

export default useSTT;
