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
    <div className="min-h-screen h-screen flex flex-col bg-canvas text-text-main select-none overflow-hidden">
      {/* Kiosk Examination Top Header */}
      <Header
        title={titleText}
        centerContent={timerSlot}
        subtitle={`Candidate: ${studentName}`}
        onOpenAccessibility={onOpenAccessibility}
      />

      {/* Main Container — fills all remaining vertical space */}
      <div className="flex-1 flex flex-row w-full overflow-hidden min-h-0">
        {/* Primary Content Workbench Area — takes all available width */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-5 lg:p-6 xl:p-8 overflow-y-auto focus-visible:outline-none min-w-0"
        >
          {content}
        </main>

        {/* Question Palette Sidebar — rem-based width scales with font size */}
        {sidebarContent && (
          <aside
            id="skip-to-palette"
            aria-label="Question palette sidebar navigation"
            className="w-[18rem] shrink-0 max-w-[50vw] border-l border-border-main bg-surface p-4 flex flex-col overflow-hidden"
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
