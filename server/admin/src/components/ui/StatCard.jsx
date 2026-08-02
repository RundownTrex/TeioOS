import React from 'react';
import { Card, CardBody } from './Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Dashboard statistic card.
 * Props: label, value, hint, trend (string), trendDirection ('up'|'down'|'neutral'),
 *        trendIcon, icon (decorative), onClick (makes card interactive), className.
 */
export const StatCard = ({
  label,
  value,
  hint,
  trend,
  trendDirection = 'neutral',
  trendIcon,
  icon,
  onClick,
  className = '',
}) => {
  const trendTone = {
    up: 'text-status-success',
    down: 'text-status-danger',
    neutral: 'text-text-muted',
  }[trendDirection] || 'text-text-muted';

  const defaultTrendIcon = {
    up: <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />,
    down: <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />,
    neutral: <Minus className="w-3.5 h-3.5" aria-hidden="true" />,
  }[trendDirection] || null;

  return (
    <Card onClick={onClick} className={className}>
      <CardBody className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-sm text-text-muted">{label}</p>
            <p className="text-lg font-semibold text-text-main tabular-nums leading-tight">
              {value}
            </p>

            {trend && (
              <p className={`text-xs font-medium flex items-center gap-1 ${trendTone}`}>
                {trendIcon || defaultTrendIcon}
                {trend}
              </p>
            )}
          </div>

          {icon && (
            <div className="shrink-0 text-text-muted">
              <span aria-hidden="true">{icon}</span>
            </div>
          )}
        </div>

        {hint && <p className="mt-3 text-xs text-text-muted">{hint}</p>}
      </CardBody>
    </Card>
  );
};

export default StatCard;
