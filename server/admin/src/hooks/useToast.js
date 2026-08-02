import { useContext, useCallback } from 'react';
import { ToastContext } from '../context/ToastContext';

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const success = useCallback(
    (message, options = {}) => context.toast(message, { type: 'success', ...options }),
    [context]
  );
  const error = useCallback(
    (message, options = {}) => context.toast(message, { type: 'error', ...options }),
    [context]
  );
  const info = useCallback(
    (message, options = {}) => context.toast(message, { type: 'info', ...options }),
    [context]
  );

  return { toast: context.toast, dismiss: context.dismiss, success, error, info };
};
