import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export const NetworkStatusIndicator = ({
  isConnected = true,
  latencyMs,
  className = '',
}) => {
  return (
    <span
      role="status"
      aria-live="assertive"
      className={`inline-flex items-center gap-1.5 text-xs font-mono leading-none select-none ${
        isConnected ? 'text-text-muted' : 'text-red-600 font-bold'
      } ${className}`}
    >
      {isConnected ? (
        <>
          <span className="shrink-0 flex items-center justify-center">
            <Wifi className="w-3.5 h-3.5 text-green-600 shrink-0" aria-hidden="true" />
          </span>
          <span className="leading-none flex items-center">Server: Connected (TLS 1.3){latencyMs ? ` │ ${latencyMs}ms` : ''}</span>
        </>
      ) : (
        <>
          <span className="shrink-0 flex items-center justify-center">
            <WifiOff className="w-3.5 h-3.5 text-red-600 animate-pulse shrink-0" aria-hidden="true" />
          </span>
          <span className="leading-none flex items-center">CONNECTION INTERRUPTED</span>
        </>
      )}
    </span>
  );
};

export default NetworkStatusIndicator;
