import React from 'react';
import { Button } from './Button';
import { AlertCircle, RotateCcw } from 'lucide-react';

export const ErrorState = ({
  title = 'System Error Occurred',
  message = 'An unexpected error occurred while communicating with the server. Please try again.',
  retryLabel = 'Retry',
  onRetry,
  className = '',
}) => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`p-6 border border-status-danger-border bg-surface rounded flex flex-col items-center justify-center text-center max-w-md mx-auto ${className}`}
    >
      <div className="p-2.5 bg-status-danger-bg text-status-danger border border-status-danger-border rounded mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>

      <h3 className="text-base font-bold font-serif text-text-main mb-2">{title}</h3>

      <p className="text-sm text-text-muted leading-relaxed mb-5">{message}</p>

      {onRetry && (
        <Button variant="primary" size="sm" onClick={onRetry} leftIcon={<RotateCcw className="w-4 h-4" />}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
