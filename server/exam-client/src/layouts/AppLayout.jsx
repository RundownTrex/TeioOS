import React from 'react';
import { Outlet } from 'react-router-dom';
import { SkipLinks } from '../components/layout/SkipLinks';
import { AccessibilityModal } from '../components/accessibility/AccessibilityModal';

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-canvas text-text-main flex flex-col font-sans">
      {/* Keyboard & Screen Reader Navigation Skip Links */}
      <SkipLinks />

      {/* Dynamic Route Content */}
      <Outlet />

      {/* Global Accessibility Settings Modal */}
      <AccessibilityModal />

      {/* Global ARIA Live Regions */}
      <div
        id="aria-live-polite"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      <div
        id="aria-live-assertive"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />
    </div>
  );
};

export default AppLayout;
