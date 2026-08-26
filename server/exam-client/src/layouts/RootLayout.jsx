import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SkipLinks } from '../components/layout/SkipLinks';
import { AccessibilityModal } from '../components/accessibility/AccessibilityModal';
import { ShortcutHelpModal, AUDIO_SHORTCUTS_TOUR } from '../components/accessibility/ShortcutHelpModal';
import { useShortcuts } from '../hooks/useShortcuts';
import { useAccessibility } from '../hooks/useAccessibility';
import { useTTS } from '../hooks/useTTS';
import { announceToScreenReader } from '../utils/ariaAnnounce';

export const RootLayout = () => {
  const location = useLocation();
  const { registerHandler, unregisterHandler } = useShortcuts();
  const { isModalOpen, toggleModal } = useAccessibility();
  const { speakText, stopSpeech, isSpeaking } = useTTS();

  // Register global accessibility (Alt+A) and audio tour (Alt+I) shortcuts
  useEffect(() => {
    registerHandler('accessibility', () => {
      const willOpen = !isModalOpen;
      toggleModal();
      const msg = willOpen ? 'Opened Accessibility Preferences' : 'Closed Accessibility Preferences';
      speakText(msg, 'Accessibility');
    });

    registerHandler('audioTour', () => {
      if (isSpeaking) {
        stopSpeech();
      } else {
        speakText(AUDIO_SHORTCUTS_TOUR, 'Audio Navigation Guide');
      }
    });

    return () => {
      unregisterHandler('accessibility');
      unregisterHandler('audioTour');
    };
  }, [registerHandler, unregisterHandler, toggleModal, isModalOpen, speakText, stopSpeech, isSpeaking]);

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
