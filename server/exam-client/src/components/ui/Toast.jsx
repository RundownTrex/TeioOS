import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast = ({
  message,
  type = 'info',
  onClose,
  duration = 4000,
  className = '',
}) => {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 right-5 z-announcer max-w-sm w-full bg-surface text-text-main border border-border-strong rounded-lg shadow-lg p-4 flex items-center gap-3 transition-all ${className}`}
    >
      {icons[type] || icons.info}
      <div className="flex-1 text-sm font-medium">{message}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="p-1 rounded text-text-muted hover:text-text-main hover:bg-subtle transition-colors focus-visible:outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Toast;
