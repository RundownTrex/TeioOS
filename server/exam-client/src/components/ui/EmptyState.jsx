import React from 'react';
import { Button } from './Button';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon = <Inbox className="w-8 h-8 text-text-muted" />,
  title = 'No items found',
  description = 'There are no items to display at this time.',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      role="status"
      className={`p-6 border border-border-main bg-surface rounded-xl flex flex-col items-center justify-center text-center max-w-md mx-auto ${className}`}
    >
      <div className="p-3 bg-subtle rounded-full mb-4">{icon}</div>

      <h3 className="text-base font-bold text-text-main mb-1.5">{title}</h3>

      {description && (
        <p className="text-sm text-text-muted leading-relaxed mb-5">{description}</p>
      )}

      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
