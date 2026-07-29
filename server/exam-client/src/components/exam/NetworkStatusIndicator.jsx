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
      className={`inline-flex items-center gap-1.5 text-xs font-mono select-none ${
        isConnected ? 'text-text-muted' : 'text-red-600 font-bold'
      } ${className}`}
    >
      {isConnected ? (
        <>
          <Wifi className="w-3.5 h-3.5 text-green-600 shrink-0" aria-hidden="true" />
          <span>Server: Connected (TLS 1.3){latencyMs ? ` │ ${latencyMs}ms` : ''}</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5 text-red-600 shrink-0 animate-pulse" aria-hidden="true" />
          <span>CONNECTION INTERRUPTED</span>
        </>
      )}
    </span>
  );
};

export default NetworkStatusIndicator;
