import React from 'react';
import { Wifi, Monitor, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

/**
 * Dynamic resolution of machine / terminal / candidate telemetry for TeioOS status bar.
 * Structured resolution:
 * 1. Explicit terminal ID (prop `nodeId`, `VITE_TEIOOS_TERMINAL_ID`, or `window.__TEIOOS_NODE_ID__`)
 * 2. Authenticated candidate Roll Number (`Candidate ID: <roll_number>`)
 * 3. Network host IP/domain during browser testing (`Host: <hostname>`)
 */
export const getTerminalInfo = (nodeId, userProfile) => {
  const envTerminal =
    (nodeId && nodeId !== 'LAB-02-NODE-04' ? nodeId : null) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TEIOOS_TERMINAL_ID) ||
    (typeof window !== 'undefined' && window.__TEIOOS_NODE_ID__);

  if (envTerminal) {
    return { label: 'Terminal', value: envTerminal };
  }

  if (userProfile?.roll_number) {
    const host = typeof window !== 'undefined' ? window.location?.hostname : '';
    const hostSuffix = host && host !== 'localhost' && host !== '127.0.0.1' ? ` (${host})` : '';
    return { label: 'Candidate ID', value: `${userProfile.roll_number}${hostSuffix}` };
  }

  if (typeof window !== 'undefined' && window.location?.hostname) {
    return { label: 'Host', value: window.location.hostname };
  }

  return null;
};

// Backward-compatibility export alias
export const getTerminalIdentifier = (nodeId, userProfile) => {
  const info = getTerminalInfo(nodeId, userProfile);
  return info ? info.value : null;
};

export const StatusBar = ({
  statusText = 'Session Active',
  nodeId,
  isConnected = true,
  autoSaveActive = true,
  className = '',
}) => {
  const { userProfile } = useAuth() || {};
  const terminalInfo = getTerminalInfo(nodeId, userProfile);

  return (
    <div
      role="region"
      aria-label="System status telemetry"
      className={`h-9 px-4 text-xs bg-subtle text-text-muted border-t border-border-main flex items-center justify-between gap-4 font-mono leading-none select-none ${className}`}
    >
      <div className="flex items-center gap-3 truncate">
        <span className="flex items-center gap-1.5 font-mono font-medium text-text-main leading-none truncate">
          <span className="shrink-0 flex items-center justify-center">
            <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
          </span>
          <span className="leading-none flex items-center">{statusText}</span>
        </span>

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

      <div className="flex items-center gap-4 shrink-0 font-mono leading-none">
        {autoSaveActive && (
          <span className="hidden md:inline-block text-green-700 font-mono font-medium leading-none">
            Auto-Save: Active
          </span>
        )}

        <span className="flex items-center gap-1.5 font-mono leading-none">
          <span className="shrink-0 flex items-center justify-center">
            <Wifi className={`w-3.5 h-3.5 ${isConnected ? 'text-green-600' : 'text-red-600'} shrink-0`} />
          </span>
          <span className="leading-none flex items-center">{isConnected ? 'Server: Connected (TLS 1.3)' : 'Disconnected'}</span>
        </span>
      </div>
    </div>
  );
};

export default StatusBar;
