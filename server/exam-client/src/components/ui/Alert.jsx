import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export const Alert = ({
  title,
  children,
  variant = 'info',
  onClose,
  className = '',
  ...props
}) => {
  const icons = {
    info: <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />,
    success: <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" aria-hidden="true" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />,
    error: <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />,
  };

  const variants = {
    info: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-text-main',
    success: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-text-main',
    warning: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-text-main',
    error: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-text-main',
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
        {title && <h4 className="font-semibold mb-0.5 text-text-main">{title}</h4>}
        <div className="text-text-main">{children}</div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className="p-1 rounded-md hover:bg-subtle transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-primary"
        >
          <X className="w-4 h-4 text-text-muted" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default Alert;
