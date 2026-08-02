import React from 'react';

/**
 * Accessible horizontal bar chart (design system §10.4: any chart has an
 * exact data equivalent — every row carries its numbers in an aria-label).
 *
 * Props:
 *   items: [{ key, label, value, tone }]
 *     tone: 'navy' (default) | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
 *   valueFormatter: (value) => string  (defaults to String)
 *   max: optional fixed maximum for relative widths (defaults to the largest value)
 *   className
 */
export const BarList = ({ items = [], valueFormatter, max, className = '' }) => {
  const formatValue = valueFormatter || ((value) => String(value));
  const largest = max ?? Math.max(0, ...items.map((item) => item.value));

  const toneClasses = {
    navy: 'bg-navy-primary',
    success: 'bg-status-success',
    warning: 'bg-status-warning',
    danger: 'bg-status-danger',
    info: 'bg-status-info',
    neutral: 'bg-status-neutral',
  };

  return (
    <ul role="list" className={`flex flex-col gap-4 ${className}`}>
      {items.map((item) => {
        const widthPct = largest > 0 ? Math.max(1, (item.value / largest) * 100) : 0;
        return (
          <li key={item.key} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-text-main truncate">{item.label}</span>
              <span className="text-sm font-medium text-text-main tabular-nums shrink-0">
                {formatValue(item.value)}
              </span>
            </div>
            <div
              className="h-2.5 w-full rounded-full bg-subtle overflow-hidden"
              role="img"
              aria-label={`${item.label}: ${formatValue(item.value)}`}
            >
              <div
                className={`h-full rounded-full ${toneClasses[item.tone] || toneClasses.navy}`}
                style={{ width: `${Math.min(100, widthPct)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default BarList;
