import React from 'react';
import { Button } from './Button';
import { AlertCircle, RotateCcw } from 'lucide-react';

export const ErrorState = ({
  title = 'System Error Occurred',
  message = 'An unexpected error occurred while communicating with the server. Local data progress has been preserved.',
  retryLabel = 'Retry Synchronization',
  onRetry,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`p-6 border border-red-200 bg-surface rounded-xl flex flex-col items-center justify-center text-center max-w-md mx-auto shadow-sm ${className}`}
    >
      <div className="p-3 bg-red-50 text-red-700 rounded-full mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>

      <h3 className="text-base font-bold text-text-main mb-2">{title}</h3>

      <p className="text-sm text-text-muted leading-relaxed mb-5">{message}</p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {onRetry && (
          <Button variant="primary" size="sm" onClick={onRetry} leftIcon={<RotateCcw className="w-4 h-4" />}>
            {retryLabel}
          </Button>
        )}
        {onAction && actionLabel && (
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
