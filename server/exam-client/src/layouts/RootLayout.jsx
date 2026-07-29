import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SkipLinks } from '../components/layout/SkipLinks';
import { AccessibilityModal } from '../components/accessibility/AccessibilityModal';
import { ShortcutHelpModal } from '../components/accessibility/ShortcutHelpModal';
import { announceToScreenReader } from '../utils/ariaAnnounce';

export const RootLayout = () => {
  const location = useLocation();

  // Automatic Screen Reader Announcement on Route Page Change
  useEffect(() => {
    const path = location.pathname;
    let pageTitle = 'Examination Platform';

    if (path.includes('/login')) {
      pageTitle = 'Student Examination Login Portal';
    } else if (path.includes('/dashboard')) {
      pageTitle = 'Student Dashboard. Available examinations loaded.';
    } else if (path.includes('/instructions')) {
      pageTitle = 'Examination Instructions and Candidate Rules';
    } else if (path.includes('/active')) {
      pageTitle = 'Active Examination Workbench Session';
    } else if (path.includes('/submitted')) {
      pageTitle = 'Paper Submitted Confirmation';
    } else if (path.includes('/results')) {
      pageTitle = 'Examination Performance Report';
    } else if (path.includes('/resume')) {
      pageTitle = 'Resume Examination Session';
    }

    announceToScreenReader(`Navigated to ${pageTitle}`);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-canvas text-text-main flex flex-col font-sans">
      {/* Keyboard & Screen Reader Navigation Skip Links */}
      <SkipLinks />

      {/* Dynamic Main Routing Content */}
      <Outlet />

      {/* Global Accessibility Settings Modal */}
      <AccessibilityModal />

      {/* Global Keyboard Shortcuts Reference Modal */}
      <ShortcutHelpModal />

      {/* Screen Reader ARIA Live Regions */}
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

export default RootLayout;
