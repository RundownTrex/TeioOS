import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AccessibilityProvider } from './context/AccessibilityContext';
import { TTSProvider } from './context/TTSContext';
import { STTProvider } from './context/STTContext';
import { ShortcutProvider } from './context/ShortcutContext';
import { AuthProvider } from './context/AuthContext';
import { ExamProvider } from './context/ExamContext';

import { RootLayout } from './layouts/RootLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

import { ProtectedRoute } from './routes/ProtectedRoute';
import { ActiveExamRoute } from './routes/ActiveExamRoute';

import { LoginPage } from './pages/LoginPage';
import { SessionExpiredPage } from './pages/SessionExpiredPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { DashboardPage } from './pages/DashboardPage';
import { InstructionsPage } from './pages/InstructionsPage';
import { ActiveExamPage } from './pages/ActiveExamPage';
import { SubmittedPage } from './pages/SubmittedPage';
import { ResumeExamPage } from './pages/ResumeExamPage';
import { ResultsPage } from './pages/ResultsPage';
import { OfflinePage } from './pages/OfflinePage';
import { LoadingPage } from './pages/LoadingPage';
import { EmptyPage } from './pages/EmptyPage';
import { ErrorPage } from './pages/ErrorPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Instantiate TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AccessibilityProvider>
        <TTSProvider>
          <STTProvider>
            <ShortcutProvider>
              <AuthProvider>
                <ExamProvider>
                  <BrowserRouter>
                    <Routes>
                      <Route element={<RootLayout />}>
                        {/* Default root redirects to dashboard */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />

                        {/* Public Authentication Routes */}
                        <Route
                          path="/login"
                          element={
                            <AuthLayout>
                              <LoginPage />
                            </AuthLayout>
                          }
                        />
                        <Route
                          path="/session-expired"
                          element={
                            <AuthLayout>
                              <SessionExpiredPage />
                            </AuthLayout>
                          }
                        />
                        <Route
                          path="/unauthorized"
                          element={
                            <AuthLayout>
                              <UnauthorizedPage />
                            </AuthLayout>
                          }
                        />

                        {/* System Fallback State Views */}
                        <Route path="/offline" element={<OfflinePage />} />
                        <Route path="/loading" element={<LoadingPage />} />
                        <Route path="/empty" element={<EmptyPage />} />
                        <Route path="/error" element={<ErrorPage />} />

                        {/* Student Authentication Protected Routes */}
                        <Route element={<ProtectedRoute />}>
                          <Route element={<DashboardLayout />}>
                            <Route path="/dashboard" element={<DashboardPage />} />
                          </Route>

                          {/* Examination Instructions Pre-paper Route */}
                          <Route path="/exam/:scheduleId/instructions" element={<InstructionsPage />} />

                          {/* Performance Report Results Route */}
                          <Route path="/exam/:scheduleId/results" element={<ResultsPage />} />

                          {/* Resume Active Session Route */}
                          <Route path="/exam/:scheduleId/resume" element={<ResumeExamPage />} />

                          {/* Terminal Submitted Route */}
                          <Route path="/exam/:scheduleId/submitted" element={<SubmittedPage />} />

                          {/* Active Exam Kiosk Protected Routes */}
                          <Route element={<ActiveExamRoute />}>
                            <Route path="/exam/:scheduleId/active" element={<ActiveExamPage />} />
                          </Route>
                        </Route>

                        {/* 404 Fallback Route */}
                        <Route path="*" element={<NotFoundPage />} />
                      </Route>
                    </Routes>
                  </BrowserRouter>
                </ExamProvider>
              </AuthProvider>
            </ShortcutProvider>
          </STTProvider>
        </TTSProvider>
      </AccessibilityProvider>
    </QueryClientProvider>
  );
}

export default App;
