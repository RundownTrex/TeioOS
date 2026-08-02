import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

/**
 * Inline alert with icon, optional title and dismiss.
 * Props: variant ('info'|'success'|'warning'|'error'), title, children, onClose, className.
 */
export const Alert = ({
  title,
  children,
  variant = 'info',
  onClose,
  className = '',
  ...props
}) => {
  const icons = {
    info: <Info className="w-4 h-4 text-status-info shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-status-warning shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-status-danger shrink-0" />,
  };

  const variants = {
    info: 'bg-status-info-bg border-status-info-border text-text-main',
    success: 'bg-status-success-bg border-status-success-border text-text-main',
    warning: 'bg-status-warning-bg border-status-warning-border text-text-main',
    error: 'bg-status-danger-bg border-status-danger-border text-text-main',
  };

  const isAssertive = variant === 'error' || variant === 'warning';

  return (
    <div
      role={isAssertive ? 'alert' : 'status'}
      aria-live={isAssertive ? 'assertive' : 'polite'}
      className={`p-3.5 border rounded-lg flex items-start gap-3 ${
        variants[variant] || variants.info
      } ${className}`}
      {...props}
    >
      <div className="mt-0.5 shrink-0">{icons[variant] || icons.info}</div>

      <div className="flex-1 text-sm leading-relaxed">
        {title && <h4 className="font-semibold mb-0.5">{title}</h4>}
        <div>{children}</div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className="p-1 rounded-md hover:bg-subtle transition-colors shrink-0"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default Alert;
