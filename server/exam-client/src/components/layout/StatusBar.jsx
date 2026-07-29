import React from 'react';
import { Wifi, Monitor, CheckCircle } from 'lucide-react';

export const StatusBar = ({
  statusText = 'Session Active',
  nodeId = 'LAB-02-NODE-04',
  isConnected = true,
  autoSaveActive = true,
  className = '',
}) => {
  return (
    <div
      role="region"
      aria-label="System status telemetry"
      className={`h-header-sm px-4 text-xs bg-subtle text-text-muted border-t border-border-main flex items-center justify-between gap-4 font-mono select-none ${className}`}
    >
      <div className="flex items-center gap-4 truncate">
        <span className="flex items-center gap-1.5 font-sans font-medium text-text-main truncate">
          <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
          <span>{statusText}</span>
        </span>

        <span className="hidden sm:inline-block text-border-strong">│</span>

        <span className="hidden sm:flex items-center gap-1.5 truncate">
          <Monitor className="w-3.5 h-3.5 shrink-0 text-text-muted" />
          <span>Terminal: {nodeId}</span>
        </span>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {autoSaveActive && (
          <span className="hidden md:inline-block text-green-700 font-sans font-medium">
            Auto-Save: Active
          </span>
        )}

        <span className="flex items-center gap-1.5">
          <Wifi className={`w-3.5 h-3.5 ${isConnected ? 'text-green-600' : 'text-red-600'} shrink-0`} />
          <span>{isConnected ? 'Server: Connected (TLS 1.3)' : 'Disconnected'}</span>
        </span>
      </div>
    </div>
  );
};

export default StatusBar;
