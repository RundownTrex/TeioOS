import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

/**
 * Transient notification rendered by ToastContext.
 * Props: message, type ('info'|'success'|'error'), onClose, duration, className.
 */
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

  const tones = {
    info: { icon: <Info className="w-5 h-5 text-status-info shrink-0" />, border: 'border-status-info-border' },
    success: { icon: <CheckCircle2 className="w-5 h-5 text-status-success shrink-0" />, border: 'border-status-success-border' },
    error: { icon: <AlertCircle className="w-5 h-5 text-status-danger shrink-0" />, border: 'border-status-danger-border' },
  };

  const tone = tones[type] || tones.info;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full max-w-sm bg-surface text-text-main border ${tone.border} rounded-lg shadow-lg p-4 flex items-center gap-3 animate-slide-up ${className}`}
    >
      {tone.icon}
      <div className="flex-1 text-sm font-medium">{message}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="p-1 rounded text-text-muted hover:text-text-main hover:bg-subtle transition-colors focus-visible:outline-none"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default Toast;
