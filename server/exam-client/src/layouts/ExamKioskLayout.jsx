import React from 'react';

export const ExamKioskLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-main)]">
      {/* Distraction-free full-screen kiosk layout */}
      <main id="main-content" className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
};

export default ExamKioskLayout;
