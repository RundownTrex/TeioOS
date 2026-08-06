import React from 'react';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { NetworkStatusIndicator } from './NetworkStatusIndicator';
import { Monitor } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getTerminalInfo } from '../layout/StatusBar';

export const ExamStatusBar = ({
  syncStatus,
  isConnected = true,
  nodeId,
  className = '',
}) => {
  const { userProfile } = useAuth() || {};
  const terminalInfo = getTerminalInfo(nodeId, userProfile);

  return (
    <div
      role="region"
      aria-label="Examination telemetry status bar"
      className={`h-9 px-4 text-xs bg-subtle text-text-muted border-t border-border-main flex items-center justify-between gap-4 font-mono leading-none select-none ${className}`}
    >
      <div className="flex items-center gap-3 truncate font-mono">
        <AutoSaveIndicator status={syncStatus} />

        {terminalInfo && (
          <>
            <span className="hidden sm:inline-block w-px h-3 bg-border-strong shrink-0" aria-hidden="true" />

            <span className="hidden sm:flex items-center gap-1.5 font-mono leading-none truncate">
              <span className="shrink-0 flex items-center justify-center">
                <Monitor className="w-3.5 h-3.5 shrink-0 text-text-muted" />
              </span>
              <span className="leading-none flex items-center">
                {terminalInfo.label}: {terminalInfo.value}
              </span>
            </span>
          </>
        )}
      </div>

      <NetworkStatusIndicator isConnected={isConnected} />
    </div>
  );
};

export default ExamStatusBar;
