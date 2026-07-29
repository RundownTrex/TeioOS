import React from 'react';

export const MainContentWrapper = ({
  children,
  maxWidth = 'workbench',
  className = '',
}) => {
  const maxWidths = {
    login: 'max-w-login',
    dashboard: 'max-w-dashboard',
    reading: 'max-w-reading',
    workbench: 'max-w-workbench',
    full: 'max-w-full',
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={`flex-1 w-full mx-auto p-4 sm:p-6 focus-visible:outline-none ${
        maxWidths[maxWidth] || maxWidths.workbench
      } ${className}`}
    >
      {children}
    </main>
  );
};

export default MainContentWrapper;
