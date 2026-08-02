import React, { useState, useCallback, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SkipLinks } from './SkipLinks';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { PageContainer } from './PageContainer';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { announceToScreenReader } from '../../utils/ariaAnnounce';

/**
 * Application layout engine.
 * Props: variant ('admin'|'auth'|'system'), className.
 * - admin: Sidebar + Header + main#main-content + Footer around <Outlet/>.
 * - auth:  centered column, max-w-login (login screens).
 * - system: centered column, max-w-md (403/404/offline/error screens).
 */
export const AppShell = ({ variant = 'admin', className = '' }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    announceToScreenReader(`Navigated to ${location.pathname}`);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-canvas text-text-main flex flex-col font-sans">
      <SkipLinks />

      <ErrorBoundary>
        {variant === 'admin' ? (
          <div className="flex-1 flex min-h-screen">
            <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

            <div className="flex-1 flex flex-col min-w-0">
              <Header onMenuClick={() => setIsSidebarOpen(true)} />

              <main id="main-content" className="flex-1 flex flex-col">
                <PageContainer className="flex-1">
                  <Outlet />
                </PageContainer>
              </main>

              <Footer />
            </div>
          </div>
        ) : (
          <main
            id="main-content"
            className="flex-1 flex items-center justify-center px-4 py-12"
          >
            <div className={`w-full ${variant === 'auth' ? 'max-w-login' : 'max-w-md'}`}>
              <Outlet />
            </div>
          </main>
        )}
      </ErrorBoundary>

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

export default AppShell;
