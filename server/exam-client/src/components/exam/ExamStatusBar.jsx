import React from 'react';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { NetworkStatusIndicator } from './NetworkStatusIndicator';
import { Monitor } from 'lucide-react';

export const ExamStatusBar = ({
  syncStatus,
  isConnected = true,
  nodeId = 'LAB-02-NODE-04',
  className = '',
}) => {
  return (
    <div
      role="region"
      aria-label="Examination telemetry status bar"
      className={`h-header-sm px-4 text-xs bg-subtle text-text-muted border-t border-border-main flex items-center justify-between gap-4 font-mono select-none ${className}`}
    >
      <div className="flex items-center gap-4 truncate">
        <AutoSaveIndicator status={syncStatus} />

        <span className="hidden sm:inline-block text-border-strong">│</span>

        <span className="hidden sm:flex items-center gap-1.5 truncate">
          <Monitor className="w-3.5 h-3.5 shrink-0 text-text-muted" />
          <span>Terminal: {nodeId}</span>
        </span>
      </div>

      <NetworkStatusIndicator isConnected={isConnected} />
    </div>
  );
};

export default ExamStatusBar;
