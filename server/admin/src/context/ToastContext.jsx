import React, { createContext, useEffect, useState, useCallback } from 'react';
import { toastStore } from './toastStore';
import { Toast } from '../components/ui/Toast';

export const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState(toastStore.getToasts());

  useEffect(() => {
    const unsubscribe = toastStore.subscribe(setToasts);
    return unsubscribe;
  }, []);

  const dismiss = useCallback((id) => {
    toastStore.dismiss(id);
  }, []);

  const toast = useCallback((message, options = {}) => {
    return toastStore.push({ message, ...options });
  }, []);

  const value = { toast, dismiss };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-5 right-5 z-announcer flex flex-col items-end gap-2 pointer-events-none"
        role="status"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((item) => (
          <div key={item.id} className="w-[min(calc(100vw-2.5rem),24rem)] pointer-events-auto">
            <Toast
              message={item.message}
              type={item.type}
              duration={item.duration}
              onClose={() => dismiss(item.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
