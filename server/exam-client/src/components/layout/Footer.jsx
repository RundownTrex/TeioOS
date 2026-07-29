import React from 'react';
import { StatusBar } from './StatusBar';

export const Footer = ({
  statusText,
  nodeId,
  isConnected,
  autoSaveActive,
  className = '',
}) => {
  return (
    <footer className={`mt-auto select-none ${className}`}>
      <StatusBar
        statusText={statusText}
        nodeId={nodeId}
        isConnected={isConnected}
        autoSaveActive={autoSaveActive}
      />
    </footer>
  );
};

export default Footer;
