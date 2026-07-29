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
    info: <Info className="w-4 h-4 text-blue-700 shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />,
  };

  const variants = {
    info: 'bg-blue-50 border-blue-200 text-blue-950',
    success: 'bg-green-50 border-green-200 text-green-950',
    warning: 'bg-amber-50 border-amber-200 text-amber-950',
    error: 'bg-red-50 border-red-200 text-red-950',
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
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
