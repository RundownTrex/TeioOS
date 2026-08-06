import React from 'react';
import { CheckCircle2, RefreshCw, AlertTriangle, CloudOff } from 'lucide-react';
import { SYNC_STATUS } from '../../utils/constants';

export const AutoSaveIndicator = ({
  status = SYNC_STATUS.SAVED,
  className = '',
}) => {
  const configs = {
    [SYNC_STATUS.IDLE]: {
      text: 'Auto-Save: Active',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-text-muted shrink-0" />,
      colorClass: 'text-text-muted',
    },
    [SYNC_STATUS.SAVING]: {
      text: 'Saving response...',
      icon: <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />,
      colorClass: 'text-blue-600 font-medium',
    },
    [SYNC_STATUS.SAVED]: {
      text: 'Response Saved',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />,
      colorClass: 'text-green-700 dark:text-green-400 font-medium',
    },
    [SYNC_STATUS.RETRYING]: {
      text: 'Retrying server sync...',
      icon: <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin shrink-0" />,
      colorClass: 'text-amber-600 font-medium',
    },
    [SYNC_STATUS.LOCAL]: {
      text: 'Saved in Offline Queue',
      icon: <CloudOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
      colorClass: 'text-amber-700 font-medium',
    },
    [SYNC_STATUS.OFFLINE]: {
      text: 'Offline (Answers Queued)',
      icon: <CloudOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
      colorClass: 'text-amber-700 font-medium',
    },
    [SYNC_STATUS.RECOVERY]: {
      text: 'Syncing Offline Queue...',
      icon: <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />,
      colorClass: 'text-blue-600 font-medium',
    },
    [SYNC_STATUS.ERROR]: {
      text: 'Saved in Local Cache',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
      colorClass: 'text-amber-600 font-medium',
    },
  };

  const config = configs[status] || configs[SYNC_STATUS.SAVED];

  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 text-xs font-mono leading-none select-none ${config.colorClass} ${className}`}
    >
      <span className="shrink-0 flex items-center justify-center">{config.icon}</span>
      <span className="leading-none flex items-center">{config.text}</span>
    </span>
  );
};

export default AutoSaveIndicator;
