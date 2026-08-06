import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PATHS } from './paths';
import { USER_ROLES } from '../utils/constants';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';
import { AppShell } from '../components/layout/AppShell';
import { FeaturePlaceholder } from '../components/ui/FeaturePlaceholder';
import { PageSkeleton } from '../components/ui/PageSkeleton';
import { ErrorState } from '../components/ui/ErrorState';

const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'));
const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage'));
const DepartmentsListPage = lazy(() => import('../features/departments/pages/DepartmentsListPage'));
const DepartmentFormPage = lazy(() => import('../features/departments/pages/DepartmentFormPage'));
const ClassesListPage = lazy(() => import('../features/classes/pages/ClassesListPage'));
const ClassFormPage = lazy(() => import('../features/classes/pages/ClassFormPage'));
const SubjectsListPage = lazy(() => import('../features/subjects/pages/SubjectsListPage'));
const SubjectFormPage = lazy(() => import('../features/subjects/pages/SubjectFormPage'));
const StudentsListPage = lazy(() => import('../features/students/pages/StudentsListPage'));
const StudentFormPage = lazy(() => import('../features/students/pages/StudentFormPage'));
const StudentDetailPage = lazy(() => import('../features/students/pages/StudentDetailPage'));
const AdministratorsListPage = lazy(() => import('../features/administrators/pages/AdministratorsListPage'));
const AdministratorFormPage = lazy(() => import('../features/administrators/pages/AdministratorFormPage'));
const AdministratorDetailPage = lazy(() => import('../features/administrators/pages/AdministratorDetailPage'));
const ExamsListPage = lazy(() => import('../features/exams/pages/ExamsListPage'));
const ExamFormPage = lazy(() => import('../features/exams/pages/ExamFormPage'));
const ExamDetailPage = lazy(() => import('../features/exams/pages/ExamDetailPage'));
const QuestionFormPage = lazy(() => import('../features/exams/pages/QuestionFormPage'));
const SchedulesListPage = lazy(() => import('../features/schedules/pages/SchedulesListPage'));
const ScheduleFormPage = lazy(() => import('../features/schedules/pages/ScheduleFormPage'));
const ScheduleAssignmentsPage = lazy(() => import('../features/schedules/pages/ScheduleAssignmentsPage'));
const EvaluationListPage = lazy(() => import('../features/evaluation/pages/EvaluationListPage'));
const EvaluationWorkbenchPage = lazy(() => import('../features/evaluation/pages/EvaluationWorkbenchPage'));
const ResultsListPage = lazy(() => import('../features/results/pages/ResultsListPage'));
const ResultDetailPage = lazy(() => import('../features/results/pages/ResultDetailPage'));
const AnalyticsOverviewPage = lazy(() => import('../features/analytics/pages/AnalyticsOverviewPage'));
const StudentMonitoringPage = lazy(() => import('../features/analytics/pages/StudentMonitoringPage'));
const ExamMonitoringPage = lazy(() => import('../features/analytics/pages/ExamMonitoringPage'));
const ReportsIndexPage = lazy(() => import('../features/reports/pages/ReportsIndexPage'));
const StudentResultsReportPage = lazy(() => import('../features/reports/pages/StudentResultsReportPage'));
const ExamSummaryReportPage = lazy(() => import('../features/reports/pages/ExamSummaryReportPage'));
const EvaluationSummaryReportPage = lazy(() => import('../features/reports/pages/EvaluationSummaryReportPage'));
const SettingsPage = lazy(() => import('../features/settings/pages/SettingsPage'));

/**
 * Feature routes render FeaturePlaceholder until their screens are
 * implemented in later milestones. Each route block below is written so
 * the element can be swapped for a lazy import without structural changes.
 */
const placeholder = (title) => <FeaturePlaceholder title={title} />;

const renderSystemState = (title, message, retryLabel, onRetry) => (
  <ErrorState title={title} message={message} retryLabel={retryLabel} onRetry={onRetry} />
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        {/* Default root redirects to the admin dashboard */}
        <Route path="/" element={<Navigate to={PATHS.DASHBOARD} replace />} />

        {/* Public Authentication Route */}
        <Route element={<AppShell variant="auth" />}>
          <Route path={PATHS.LOGIN} element={<LoginPage />} />
        </Route>

        {/* System Fallback State Views */}
        <Route element={<AppShell variant="system" />}>
          <Route
            path={PATHS.UNAUTHORIZED}
            element={renderSystemState(
              'Access Restricted',
              'You are not authorized to access this section. Contact a TeioOS administrator if you believe this is an error.',
              'Go to Dashboard',
              () => window.location.assign(PATHS.DASHBOARD)
            )}
          />
          <Route
            path={PATHS.OFFLINE}
            element={renderSystemState(
              'You Are Offline',
              'The server could not be reached. Check the network connection and try again.',
              'Retry Connection',
              () => window.location.reload()
            )}
          />
          <Route
            path={PATHS.SYSTEM_ERROR}
            element={renderSystemState(
              'System Error',
              'An unexpected error occurred. Your session and saved data remain safe on the server.',
              'Reload Application',
              () => window.location.reload()
            )}
          />

          {/* 404 Fallback */}
          <Route
            path="*"
            element={renderSystemState(
              '404 — Page Not Found',
              'The requested view does not exist or has moved.',
              'Go to Dashboard',
              () => window.location.assign(PATHS.DASHBOARD)
            )}
          />
        </Route>

        {/* Protected Admin Area */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell variant="admin" />}>
            {/* General Staff Routes: Admin & Teacher */}
            <Route element={<RoleGuard roles={[USER_ROLES.ADMIN, USER_ROLES.TEACHER]} />}>
              {/* Overview */}
              <Route path={PATHS.DASHBOARD} element={<DashboardPage />} />

              {/* Departments */}
              <Route path={PATHS.DEPARTMENTS} element={<DepartmentsListPage />} />
              <Route path={PATHS.DEPARTMENTS_NEW} element={<DepartmentFormPage />} />
              <Route
                path={PATHS.DEPARTMENT_EDIT_PATTERN}
                element={<DepartmentFormPage />}
              />

              {/* Classes */}
              <Route path={PATHS.CLASSES} element={<ClassesListPage />} />
              <Route path={PATHS.CLASSES_NEW} element={<ClassFormPage />} />
              <Route path={PATHS.CLASS_EDIT_PATTERN} element={<ClassFormPage />} />

              {/* Subjects */}
              <Route path={PATHS.SUBJECTS} element={<SubjectsListPage />} />
              <Route path={PATHS.SUBJECTS_NEW} element={<SubjectFormPage />} />
              <Route path={PATHS.SUBJECT_EDIT_PATTERN} element={<SubjectFormPage />} />

              {/* Students */}
              <Route path={PATHS.STUDENTS} element={<StudentsListPage />} />
              <Route path={PATHS.STUDENTS_NEW} element={<StudentFormPage />} />
              <Route path={PATHS.STUDENT_DETAIL_PATTERN} element={<StudentDetailPage />} />
              <Route path={PATHS.STUDENT_EDIT_PATTERN} element={<StudentFormPage />} />

              {/* Exams */}
              <Route path={PATHS.EXAMS} element={<ExamsListPage />} />
              <Route path={PATHS.EXAMS_NEW} element={<ExamFormPage />} />
              <Route path={PATHS.EXAM_DETAIL_PATTERN} element={<ExamDetailPage />} />
              <Route path={PATHS.EXAM_EDIT_PATTERN} element={<ExamFormPage />} />
              <Route path={PATHS.QUESTION_NEW_PATTERN} element={<QuestionFormPage />} />
              <Route
                path={PATHS.QUESTION_EDIT_PATTERN}
                element={<QuestionFormPage />}
              />

              {/* Exam Schedules */}
              <Route path={PATHS.SCHEDULES} element={<SchedulesListPage />} />
              <Route path={PATHS.SCHEDULES_NEW} element={<ScheduleFormPage />} />
              <Route path={PATHS.SCHEDULE_EDIT_PATTERN} element={<ScheduleFormPage />} />
              <Route
                path={PATHS.SCHEDULE_ASSIGN_PATTERN}
                element={<ScheduleAssignmentsPage />}
              />

              {/* Evaluation */}
              <Route path={PATHS.EVALUATION} element={<EvaluationListPage />} />
              <Route
                path={PATHS.EVALUATION_WORKBENCH_PATTERN}
                element={<EvaluationWorkbenchPage />}
              />

              {/* Results */}
              <Route path={PATHS.RESULTS} element={<ResultsListPage />} />
              <Route path={PATHS.RESULT_DETAIL_PATTERN} element={<ResultDetailPage />} />

              {/* Analytics & Reports */}
              <Route path={PATHS.ANALYTICS} element={<AnalyticsOverviewPage />} />
              <Route path={PATHS.ANALYTICS_STUDENTS} element={<StudentMonitoringPage />} />
              <Route path={PATHS.ANALYTICS_EXAMS} element={<ExamMonitoringPage />} />
              <Route path={PATHS.REPORTS} element={<ReportsIndexPage />} />
              <Route path={PATHS.REPORT_STUDENT} element={<StudentResultsReportPage />} />
              <Route path={PATHS.REPORT_EXAM} element={<ExamSummaryReportPage />} />
              <Route path={PATHS.REPORT_EVALUATION} element={<EvaluationSummaryReportPage />} />

              {/* Accessibility Profiles */}
              <Route
                path={PATHS.ACCESSIBILITY_PROFILES}
                element={placeholder('Accessibility Profiles')}
              />
            </Route>

            {/* Admin-only Routes */}
            <Route element={<RoleGuard roles={[USER_ROLES.ADMIN]} />}>
              {/* Administrators */}
              <Route path={PATHS.ADMINISTRATORS} element={<AdministratorsListPage />} />
              <Route path={PATHS.ADMINISTRATORS_NEW} element={<AdministratorFormPage />} />
              <Route
                path={PATHS.ADMINISTRATOR_DETAIL_PATTERN}
                element={<AdministratorDetailPage />}
              />
              <Route
                path={PATHS.ADMINISTRATOR_EDIT_PATTERN}
                element={<AdministratorFormPage />}
              />

              {/* Settings */}
              <Route path={PATHS.SETTINGS} element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
};
