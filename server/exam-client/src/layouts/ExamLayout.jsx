import React from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { useAuth } from '../hooks/useAuth';

export const ExamLayout = ({
  paperTitle = 'CS-401',
  sectionTitle,
  timerSlot,
  candidateName,
  onOpenAccessibility,
  mainContent,
  sidebarContent,
  statusText = 'Session Active',
  hideFooter = false,
  children,
}) => {
  const { userProfile } = useAuth();
  const studentName = candidateName || userProfile?.name || userProfile?.roll_number || 'Candidate';
  const content = mainContent || children;
  const titleText = sectionTitle ? `${paperTitle} │ ${sectionTitle}` : paperTitle;

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-text-main select-none">
      {/* Kiosk Examination Top Header */}
      <Header
        title={titleText}
        centerContent={timerSlot}
        subtitle={`Candidate: ${studentName}`}
        onOpenAccessibility={onOpenAccessibility}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-workbench mx-auto overflow-hidden">
        {/* Primary Content Workbench Area */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 sm:p-6 overflow-y-auto focus-visible:outline-none"
        >
          {content}
        </main>

        {/* Render Sidebar ONLY when sidebarContent is provided */}
        {sidebarContent && (
          <aside
            id="skip-to-palette"
            aria-label="Question palette sidebar navigation"
            className="w-full md:w-sidebar shrink-0 border-t md:border-t-0 md:border-l border-border-main bg-surface p-4 flex flex-col justify-between"
          >
            {sidebarContent}
          </aside>
        )}
      </div>

      {/* Persistent Status Bar Footer (Rendered only when hideFooter is false) */}
      {!hideFooter && <Footer statusText={statusText} autoSaveActive={true} />}
    </div>
  );
};

export default ExamLayout;
